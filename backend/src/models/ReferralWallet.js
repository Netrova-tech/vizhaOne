const mongoose = require("mongoose");

const referralEntrySchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  referredMobile: { type: String, required: true },
  points: { type: Number, default: 10 },
  status: { type: String, enum: ["pending", "confirmed", "reversed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
}, { _id: true });

const referralWalletSchema = new mongoose.Schema({
  ownerMobile: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true, index: true, uppercase: true },
  points: { type: Number, default: 0, min: 0 },
  totalReferrals: { type: Number, default: 0, min: 0 },
  entries: [referralEntrySchema],
}, { timestamps: true });

module.exports = mongoose.models.ReferralWallet || mongoose.model("ReferralWallet", referralWalletSchema);
