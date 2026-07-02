const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    mobile: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
