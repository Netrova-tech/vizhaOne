const crypto = require("node:crypto");
const { query, transaction } = require("../db/pool");
const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").slice(-10);
const makeCode = (mobile) => `VIZHA${mobile.slice(-4)}${crypto.randomBytes(2).toString("hex")}`.toUpperCase();

async function getOrCreateWallet(mobileValue) {
  const ownerMobile = normalizeMobile(mobileValue);
  if (ownerMobile.length !== 10) { const e = new Error("Enter a valid 10-digit mobile number"); e.status = 400; throw e; }
  const result = await query(`INSERT INTO referral_wallets(owner_mobile,code) VALUES($1,$2)
    ON CONFLICT(owner_mobile) DO UPDATE SET owner_mobile=EXCLUDED.owner_mobile RETURNING *`, [ownerMobile, makeCode(ownerMobile)]);
  return result.rows[0];
}
async function registerReferral({ code, referredMobile, bookingId }) {
  if (!code) return null;
  const mobile = normalizeMobile(referredMobile);
  return transaction(async (client) => {
    const wallet = (await client.query("SELECT * FROM referral_wallets WHERE code=$1 FOR UPDATE", [String(code).trim().toUpperCase()])).rows[0];
    if (!wallet) { const e = new Error("Invalid referral code"); e.status = 400; throw e; }
    if (wallet.owner_mobile === mobile) { const e = new Error("Self-referral is not allowed"); e.status = 400; throw e; }
    try { await client.query("INSERT INTO referral_transactions(wallet_id,booking_id,referred_mobile,points,status) VALUES($1,$2,$3,10,'pending')", [wallet.id, bookingId, mobile]); }
    catch (error) { if (error.code === "23505") { const e = new Error("This mobile number has already used a referral"); e.status = 400; throw e; } throw error; }
    return wallet;
  });
}
async function syncBookingReward(bookingId, status) {
  return transaction(async (client) => {
    const entry = (await client.query("SELECT * FROM referral_transactions WHERE booking_id=$1 FOR UPDATE", [bookingId])).rows[0];
    if (!entry) return null;
    if (status === "completed" && entry.status === "pending") {
      await client.query("UPDATE referral_transactions SET status='confirmed',confirmed_at=now() WHERE id=$1", [entry.id]);
      await client.query("UPDATE referral_wallets SET points=points+$1,total_referrals=total_referrals+1 WHERE id=$2", [entry.points, entry.wallet_id]);
    } else if (status === "cancelled" && entry.status !== "reversed") {
      await client.query("UPDATE referral_transactions SET status='reversed' WHERE id=$1", [entry.id]);
      if (entry.status === "confirmed") await client.query("UPDATE referral_wallets SET points=GREATEST(0,points-$1),total_referrals=GREATEST(0,total_referrals-1) WHERE id=$2", [entry.points, entry.wallet_id]);
    }
    return true;
  });
}
async function walletSummary(mobile) {
  const wallet = await getOrCreateWallet(mobile);
  const entries = (await query("SELECT * FROM referral_transactions WHERE wallet_id=$1 ORDER BY created_at DESC", [wallet.id])).rows;
  return { code: wallet.code, ownerMobile: wallet.owner_mobile, points: wallet.points, totalReferrals: wallet.total_referrals,
    rewardReady: wallet.points >= 100, rewardValue: wallet.points >= 100 ? 999 : 0,
    entries: entries.map((e) => ({ bookingId:e.booking_id,referredMobile:`****${e.referred_mobile.slice(-4)}`,points:e.points,status:e.status,createdAt:e.created_at,confirmedAt:e.confirmed_at })) };
}
module.exports = { getOrCreateWallet, registerReferral, syncBookingReward, walletSummary, normalizeMobile };
