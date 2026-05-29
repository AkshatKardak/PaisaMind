const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    clientName: { type: String, required: true },
    // clientEmail is optional so the simple create-invoice form works without it
    clientEmail: { type: String, default: "" },
    serviceDescription: { type: String, default: "" },
    amount: { type: Number, required: true },
    // totalAmount stores GST-inclusive total; falls back to amount when not set
    totalAmount: { type: Number },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    items: [invoiceItemSchema],
    notes: { type: String, default: "" },
    status: { type: String, enum: ["Paid", "Unpaid", "Overdue"], default: "Unpaid" },
    paymentLink: { type: String, default: "" },
  },
  { timestamps: true }
);

// If totalAmount not explicitly set, derive it from amount
invoiceSchema.pre("save", function (next) {
  if (this.totalAmount == null) this.totalAmount = this.amount;
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
