const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createInvoicePaymentLink = async (invoice) => {
  // Fallback mock if keys not configured
  if (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID === "rzp_test_your_key_here"
  ) {
    return {
      id: `mock_${invoice._id}`,
      url: `${process.env.CLIENT_URL}/invoices?payment=mock&invoice=${invoice._id}`,
    };
  }

  const link = await razorpay.paymentLink.create({
    amount: Math.round(Number(invoice.amount) * 100), // paise
    currency: "INR",
    accept_partial: false,
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    customer: {
      name: invoice.clientName,
      email: invoice.clientEmail,
      contact: invoice.clientPhone || "",
    },
    notify: {
      sms: false,
      email: true,
    },
    reminder_enable: true,
    notes: {
      invoiceId: String(invoice._id),
      userId: String(invoice.userId),
      invoiceNumber: invoice.invoiceNumber,
    },
    callback_url: `${process.env.CLIENT_URL}/invoices?payment=success&invoice=${invoice._id}`,
    callback_method: "get",
  });

  return {
    id: link.id,
    url: link.short_url,
  };
};

// Verify Razorpay webhook signature
const verifyWebhookSignature = (rawBody, signature) => {
  const crypto = require("crypto");
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(rawBody)
    .digest("hex");
  return expectedSig === signature;
};

module.exports = { razorpay, createInvoicePaymentLink, verifyWebhookSignature };