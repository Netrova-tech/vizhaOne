const mongoose = require("mongoose");

const signupSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, trim: true },
    timestamp: { type: String, required: true },
    source: { type: String, default: "web" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Signup || mongoose.model("Signup", signupSchema);
