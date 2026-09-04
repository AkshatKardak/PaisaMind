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
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoiceNumber:      { type: String, required: true, unique: true },
    clientName:         { type: String, required: true },
    clientEmail:        { type: String, default: "" },
    clientPhone:        { type: String, default: "" },
    serviceDescription: { type: String, default: "" },
    amount:             { type: Number, required: true },
    totalAmount:        { type: Number },
    gstApplicable:      { type: Boolean, default: false },
    issueDate:          { type: Date, default: Date.now },
    dueDate:            { type: Date, required: true },
    items:              [invoiceItemSchema],
    notes:              { type: String, default: "" },
    status:             { type: String, enum: ["Paid", "Unpaid", "Overdue", "Partially Paid"], default: "Unpaid" },
    paidAt:             { type: Date, default: null },
    paymentLink:        { type: String, default: "" },
    stripePaymentUrl:   { type: String, default: "" },
    upiId:              { type: String, default: "" },
    tdsSection:         { type: String, enum: ["None", "194J_10", "194J_2", "194C_1", "Custom"], default: "None" },
    tdsRate:            { type: Number, default: 0 },
    tdsDeductedAmount:  { type: Number, default: 0 },
    netAmountReceived:  { type: Number, default: 0 },
    allocatedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true }
);

invoiceSchema.pre("save", async function () {
  if (this.totalAmount == null) this.totalAmount = this.amount;
  if (this.netAmountReceived == null || this.netAmountReceived === 0) {
    this.netAmountReceived = (this.totalAmount || this.amount) - (this.tdsDeductedAmount || 0);
  }
});

invoiceSchema.index({ userId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);

