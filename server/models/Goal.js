const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    savedAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);