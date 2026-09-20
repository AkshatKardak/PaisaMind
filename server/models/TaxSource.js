const mongoose = require("mongoose");

const taxSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authority: {
      type: String,
      required: true,
      enum: ["CBDT", "MINISTRY_OF_FINANCE", "GST_COUNCIL", "PARLIAMENT_OF_INDIA"],
      default: "CBDT",
    },
    documentType: {
      type: String,
      enum: ["FINANCE_ACT", "CIRCULAR", "NOTIFICATION", "GAZETTE", "PRESS_RELEASE"],
      default: "FINANCE_ACT",
    },
    referenceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    url: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxSource", taxSourceSchema);
