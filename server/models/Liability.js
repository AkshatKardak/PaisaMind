const mongoose = require("mongoose");

const liabilitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "credit_card",
        "personal_loan",
        "home_loan",
        "car_loan",
        "education_loan",
        "business_loan",
        "emi",
        "tax_due",
        "other",
      ],
      default: "emi",
      required: true,
    },
    principal: { type: Number, default: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0 }, // annual %
    monthlyEmi: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    nextPaymentDate: { type: Date },
    lender: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

liabilitySchema.index({ userId: 1, type: 1 });
liabilitySchema.index({ userId: 1, nextPaymentDate: 1 });

module.exports = mongoose.model("Liability", liabilitySchema);
