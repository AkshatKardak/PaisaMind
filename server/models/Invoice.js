const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity:    { type: Number, required: true, default: 1 },
    rate:        { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber:      { type: String, required: true, unique: true },
    clientName:         { type: String, required: true },
    clientEmail:        { type: String, default: "" },
    serviceDescription: { type: String, default: "" },
    amount:             { type: Number, required: true },
    totalAmount:        { type: Number },
    issueDate:          { type: Date, default: Date.now },
    dueDate:            { type: Date, required: true },
    items:              [invoiceItemSchema],
    notes:              { type: String, default: "" },
    status:             { type: String, enum: ["Paid", "Unpaid", "Overdue"], default: "Unpaid" },
    paymentLink:        { type: String, default: "" },
    stripePaymentUrl:   { type: String, default: "" },
  },
  { timestamps: true }
);

// Mongoose v7+ pre-hooks are async — do NOT use the next() callback pattern
// Using next() on undefined was throwing "next is not a function" on every Invoice.create()
invoiceSchema.pre("save", async function () {
  if (this.totalAmount == null) this.totalAmount = this.amount;
});

module.exports = mongoose.model("Invoice", invoiceSchema);
