const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    taxRegime: {
      type: String,
      enum: ["old", "new"],
      default: "new",
    },
    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("User", userSchema);
