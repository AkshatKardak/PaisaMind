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
    clientEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    items: [invoiceItemSchema],
    notes: { type: String, default: "" },
    status: { type: String, enum: ["Paid", "Unpaid", "Overdue"], default: "Unpaid" },
    paymentLink: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);