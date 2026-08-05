const crypto = require("node:crypto");
const mongoose = require("mongoose");
const ReferralWallet = require("../models/ReferralWallet");

const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").slice(-10);

function makeCode(mobile) {
  return `VIZHA${mobile.slice(-4)}${crypto.randomBytes(2).toString("hex")}`.toUpperCase();
}

async function getOrCreateWallet(mobileValue) {
  const ownerMobile = normalizeMobile(mobileValue);
  if (ownerMobile.length !== 10) {
    const error = new Error("Enter a valid 10-digit mobile number"); error.status = 400; throw error;
  }
  if (mongoose.connection.readyState !== 1) {
    const error = new Error("Database is not connected"); error.status = 503; throw error;
  }
  let wallet = await ReferralWallet.findOne({ ownerMobile });
  if (!wallet) wallet = await ReferralWallet.create({ ownerMobile, code: makeCode(ownerMobile) });
  return wallet;
}

async function registerReferral({ code, referredMobile, bookingId }) {
  if (!code) return null;
  const mobile = normalizeMobile(referredMobile);
  const wallet = await ReferralWallet.findOne({ code: String(code).trim().toUpperCase() });
  if (!wallet) { const error = new Error("Invalid referral code"); error.status = 400; throw error; }
  if (wallet.ownerMobile === mobile) { const error = new Error("Self-referral is not allowed"); error.status = 400; throw error; }
  const duplicate = await ReferralWallet.findOne({ "entries.referredMobile": mobile, "entries.status": { $ne: "reversed" } });
  if (duplicate) { const error = new Error("This mobile number has already used a referral"); error.status = 400; throw error; }
  wallet.entries.push({ bookingId, referredMobile: mobile, points: 10, status: "pending" });
  await wallet.save();
  return wallet;
}

async function syncBookingReward(bookingId, status) {
  const wallet = await ReferralWallet.findOne({ "entries.bookingId": bookingId });
  if (!wallet) return;
  const entry = wallet.entries.find((item) => item.bookingId === bookingId);
  if (!entry) return;
  if (status === "completed" && entry.status === "pending") {
    entry.status = "confirmed"; entry.confirmedAt = new Date();
    wallet.points += entry.points; wallet.totalReferrals += 1;
  } else if (status === "cancelled" && entry.status !== "reversed") {
    if (entry.status === "confirmed") {
      wallet.points = Math.max(0, wallet.points - entry.points);
      wallet.totalReferrals = Math.max(0, wallet.totalReferrals - 1);
    }
    entry.status = "reversed";
  }
  await wallet.save();
}

async function walletSummary(mobile) {
  const wallet = await getOrCreateWallet(mobile);
  return {
    code: wallet.code, ownerMobile: wallet.ownerMobile, points: wallet.points,
    totalReferrals: wallet.totalReferrals, rewardReady: wallet.points >= 100,
    rewardValue: wallet.points >= 100 ? 999 : 0,
    entries: [...wallet.entries].reverse().map((entry) => ({
      bookingId: entry.bookingId,
      referredMobile: `****${entry.referredMobile.slice(-4)}`,
      points: entry.points,
      status: entry.status,
      createdAt: entry.createdAt,
      confirmedAt: entry.confirmedAt,
    })),
  };
}

module.exports = { getOrCreateWallet, registerReferral, syncBookingReward, walletSummary, normalizeMobile };
