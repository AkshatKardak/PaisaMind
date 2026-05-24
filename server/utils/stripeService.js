const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createInvoicePaymentLink = async (invoice) => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_your_stripe_key") {
    return {
      id: `mock_${invoice._id}`,
      url: `${process.env.CLIENT_URL}/invoices?payment=mock&invoice=${invoice._id}`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "inr",
          unit_amount: Math.round(invoice.totalAmount * 100),
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            description: invoice.serviceDescription,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/invoices?payment=success&invoice=${invoice._id}`,
    cancel_url: `${process.env.CLIENT_URL}/invoices?payment=cancelled&invoice=${invoice._id}`,
    metadata: {
      invoiceId: invoice._id.toString(),
      userId: invoice.userId.toString(),
    },
  });

  return { id: session.id, url: session.url };
};

module.exports = {
  stripe,
  createInvoicePaymentLink,
};
