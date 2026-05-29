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

const getSummary = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user._id });
  const totalBilled   = invoices.reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  const totalReceived = invoices.filter((inv) => inv.status === "Paid").reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  const totalPending  = invoices.filter((inv) => inv.status !== "Paid").reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  res.status(200).json({ success: true, data: { totalBilled, totalReceived, totalPending } });
});

const createInvoice = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const { clientName, clientEmail, clientPhone, serviceDescription, amount, issueDate, dueDate, gstApplicable, items, notes } = req.body;

  if (!clientName || !amount) {
    return res.status(400).json({ success: false, message: "Client name and amount are required" });
  }

  const count = await Invoice.countDocuments({ userId: req.user._id });
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;

  const baseAmount = Number(amount) || 0;
  const totalAmount = gstApplicable ? Math.round(baseAmount * 1.18) : baseAmount;

  const invoice = await Invoice.create({
    userId: req.user._id,
    invoiceNumber,
    clientName,
    clientEmail: clientEmail || "",
    clientPhone: clientPhone || "",
    serviceDescription: serviceDescription || "",
    amount: baseAmount,
    totalAmount,
    issueDate: issueDate ? new Date(issueDate) : new Date(),
    dueDate: dueDate ? new Date(dueDate) : new Date(),
    items: items || [],
    notes: notes || "",
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

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const normalized = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Paid";
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: normalized },
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

  if (invoice.clientEmail) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@paisamind.com",
      to: invoice.clientEmail,
      subject: `Payment reminder for ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #0ea5e9;">Payment Reminder</h2>
          <p>Hi ${invoice.clientName},</p>
          <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> for 
          <strong>\u20b9${invoice.totalAmount || invoice.amount}</strong> is pending.</p>
          ${invoice.paymentLink ? `<p><a href="${invoice.paymentLink}" style="background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Pay Now</a></p>` : ""}
          <p style="color:#888;font-size:12px;">PaisaMind — Finance OS for Freelancers</p>
        </div>
      `,
    });
  }

  res.status(200).json({ success: true, message: "Reminder sent" });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  const link = await createInvoicePaymentLink(invoice);
  await Invoice.findByIdAndUpdate(invoice._id, { paymentLink: link.url });
  res.status(200).json({ success: true, data: { url: link.url } });
});

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
  getSummary,
  createInvoice,
  updateInvoice,
  updateStatus,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
  handleWebhook,
};
