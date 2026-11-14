const mongoose = require("mongoose");
const { encryptData, maskPAN } = require("../utils/cryptoUtils");

const tdsRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deductorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    deductorTAN: {
      type: String,
      trim: true,
      uppercase: true,
    },
    deductorPAN: {
      type: String,
      trim: true,
      uppercase: true,
    },
    section: {
      type: String,
      default: "194J",
      trim: true,
      uppercase: true,
    },
    financialYear: {
      type: String,
      default: "2025-26",
      index: true,
    },
    assessmentYear: {
      type: String,
      default: "2026-27",
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    creditAmount: {
      type: Number,
      required: true,
    },
    tdsDeducted: {
      type: Number,
      required: true,
    },
    tdsDeposited: {
      type: Number,
      default: 0,
    },
    challanNumber: {
      type: String,
      trim: true,
    },
    certificateNumber: {
      type: String,
      trim: true,
    },
    reconciliationStatus: {
      type: String,
      enum: [
        "PENDING",
        "MATCHED",
        "PARTIAL_MATCH",
        "TDS_MISMATCH",
        "BANK_MISMATCH",
        "MISSING_TDS",
        "MISSING_PAYMENT",
        "DUPLICATE",
        "REVIEW_REQUIRED",
        "UNRESOLVED",
      ],
      default: "PENDING",
      index: true,
    },
    source: {
      type: String,
      enum: ["26AS_IMPORT", "AIS_TIS", "FORM_16A", "MANUAL_ENTRY"],
      default: "MANUAL_ENTRY",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawEncryptedPAN: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        if (ret.deductorPAN) {
          ret.deductorPAN = maskPAN(ret.deductorPAN);
        }
        delete ret.rawEncryptedPAN;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        if (ret.deductorPAN) {
          ret.deductorPAN = maskPAN(ret.deductorPAN);
        }
        delete ret.rawEncryptedPAN;
        return ret;
      },
    },
  }
);

tdsRecordSchema.pre("save", function () {
  if (this.deductorPAN) {
    // Encrypt at rest with AES-256-GCM
    this.rawEncryptedPAN = encryptData(this.deductorPAN);
    // Mask in field
    this.deductorPAN = maskPAN(this.deductorPAN);
  }
});

module.exports = mongoose.model("TDSRecord", tdsRecordSchema);
