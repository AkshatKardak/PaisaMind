const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Invoice = require("../models/Invoice");
const { Resend } = require("resend");
const { createInvoicePaymentLink, verifyWebhookSignature } = require("../utils/razorpayService");

const resend = new Resend(process.env.RESEND_API_KEY);

const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

const createInvoice = asyncHandler(async (req, res) => {
  const { clientName, clientEmail, clientPhone, amount, dueDate, items, notes } = req.body;

  const count = await Invoice.countDocuments({ userId: req.user._id });
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;

  const invoice = await Invoice.create({
    userId: req.user._id,
    invoiceNumber,
    clientName,
    clientEmail,
    clientPhone: clientPhone || "",
    amount,
    dueDate,
    items,
    notes,
    status: "Unpaid",
  });

  res.status(201).json({ success: true, data: invoice });
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  res.status(200).json({ success: true, data: invoice });
});

const deleteInvoice = asyncHandler(async (req, res) => {
  await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.status(200).json({ success: true, message: "Invoice deleted" });
});

const sendReminder = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: invoice.clientEmail,
    subject: `Payment reminder for ${invoice.invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #0ea5e9;">Payment Reminder</h2>
        <p>Hi ${invoice.clientName},</p>
        <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> for 
        <strong>₹${invoice.amount}</strong> is pending.</p>
        ${invoice.paymentLink ? `<p><a href="${invoice.paymentLink}" style="background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Pay Now</a></p>` : ""}
        <p style="color:#888;font-size:12px;">PaisaMind — Finance OS for Freelancers</p>
      </div>
    `,
  });

  res.status(200).json({ success: true, message: "Reminder sent" });
});

// Creates a Razorpay payment link for the invoice
const createCheckoutSession = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  const link = await createInvoicePaymentLink(invoice);

  // Save payment link URL on invoice for use in reminder emails
  await Invoice.findByIdAndUpdate(invoice._id, { paymentLink: link.url });

  res.status(200).json({ success: true, data: { url: link.url } });
});

// Razorpay webhook — auto-marks invoice as Paid on successful payment
const handleWebhook = (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (signature) {
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  }

  const event = req.body;

  if (event?.event === "payment_link.paid") {
    const invoiceId = event?.payload?.payment_link?.entity?.notes?.invoiceId;
    if (invoiceId) {
      Invoice.findByIdAndUpdate(invoiceId, { status: "Paid" }).catch(console.error);
    }
  }

  res.status(200).json({ received: true });
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
  handleWebhook,
};