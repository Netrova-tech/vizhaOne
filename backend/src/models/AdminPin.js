const mongoose = require("mongoose");

const adminPinSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    pinHash: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminPin || mongoose.model("AdminPin", adminPinSchema);
