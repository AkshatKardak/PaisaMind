const Invoice = require("../models/Invoice");
const { stripe, createInvoicePaymentLink } = require("../utils/stripeService");

const buildInvoiceNumber = async (userId) => {
  const count = await Invoice.countDocuments({ userId });
  return `INV-${String(count + 1).padStart(3, "0")}`;
};

const enrichInvoice = (payload) => {
  const amount = Number(payload.amount || 0);
  const gstApplicable = Boolean(payload.gstApplicable);
  const gstAmount = gstApplicable ? Number((amount * 0.18).toFixed(2)) : 0;
  const totalAmount = Number((amount + gstAmount).toFixed(2));

  return {
    ...payload,
    amount,
    gstApplicable,
    gstAmount,
    totalAmount,
  };
};

const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create({
      ...enrichInvoice(req.body),
      userId: req.user._id,
      invoiceNumber: await buildInvoiceNumber(req.user._id),
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      enrichInvoice(req.body),
      { new: true, runValidators: true }
    );

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const payload = {
      status,
      ...(status === "paid" ? { paidDate: new Date() } : {}),
    };

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      payload,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

const getInvoiceSummary = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id });
    const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalReceived = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalPending = invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    res.json({
      success: true,
      summary: { totalBilled, totalReceived, totalPending },
    });
  } catch (error) {
    next(error);
  }
};

const createPaymentLink = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const session = await createInvoicePaymentLink(invoice);
    invoice.stripePaymentUrl = session.url;
    invoice.stripeSessionId = session.id;
    await invoice.save();

    res.json({ success: true, url: session.url });
  } catch (error) {
    next(error);
  }
};

const stripeWebhook = async (req, res) => {
  try {
    let event;

    if (
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_WEBHOOK_SECRET !== "whsec_your_webhook_secret" &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY !== "sk_test_your_stripe_key"
    ) {
      const signature = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body));
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;

      if (invoiceId) {
        await Invoice.findByIdAndUpdate(invoiceId, {
          status: "paid",
          paidDate: new Date(),
          paidViaStripe: true,
          stripeSessionId: session.id,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateStatus,
  getInvoiceSummary,
  createPaymentLink,
  stripeWebhook,
};
