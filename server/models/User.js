const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid:      { type: String, required: true, unique: true },
    name:             { type: String, required: true },
    email:            { type: String, required: true, unique: true },
    photoURL:         { type: String, default: "" },
    taxRegime:        { type: String, enum: ["old", "new"], default: "new" },
    investments80C:   { type: Number, default: 0 },
    investments80D:   { type: Number, default: 0 },
    // Fix: atomic counter to prevent invoiceNumber collisions on delete+recreate
    invoiceSeq:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
