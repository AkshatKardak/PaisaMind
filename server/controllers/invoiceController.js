const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");
const { Resend } = require("resend");
const Stripe = require("stripe");

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

const createInvoice = asyncHandler(async (req, res) => {
  const { clientName, clientEmail, amount, dueDate, items, notes } = req.body;

  const count = await Invoice.countDocuments({ userId: req.user._id });
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;

  const invoice = await Invoice.create({
    userId: req.user._id,
    invoiceNumber,
    clientName,
    clientEmail,
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

  const response = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: invoice.clientEmail,
    subject: `Payment reminder for ${invoice.invoiceNumber}`,
    html: `<p>Hi ${invoice.clientName},</p><p>This is a reminder that invoice ${invoice.invoiceNumber} for ₹${invoice.amount} is pending.</p>`,
  });

  res.status(200).json({ success: true, data: response });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: process.env.CLIENT_URL,
    cancel_url: process.env.CLIENT_URL,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
          },
          unit_amount: Math.round(Number(invoice.amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: String(invoice._id),
    },
  });

  res.status(200).json({ success: true, data: { url: session.url } });
});

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
};