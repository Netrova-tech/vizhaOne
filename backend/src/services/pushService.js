const { getApps, initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { query } = require("../db/pool");

function validateToken(token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 4096 || /\s/.test(token)) {
    throw Object.assign(new Error("A valid device token is required"), { status: 400 });
  }
  return token;
}
async function registerDevice(userId, token, platform) {
  validateToken(token);
  if (platform !== "android") throw Object.assign(new Error("Only Android push is supported"), { status: 400 });
  await query(`INSERT INTO push_devices(token,user_id,platform) VALUES($1,$2,$3)
    ON CONFLICT(token) DO UPDATE SET user_id=EXCLUDED.user_id,platform=EXCLUDED.platform,updated_at=now()`, [token,userId,platform]);
}
async function removeDevice(userId, token) {
  validateToken(token);
  await query("DELETE FROM push_devices WHERE token=$1 AND user_id=$2", [token,userId]);
}
async function sendUserPush(userId, title, body, route = "/bookings") {
  const devices = (await query("SELECT token FROM push_devices WHERE user_id=$1 ORDER BY updated_at DESC", [userId])).rows;
  if (!devices.length) return { sent: 0, failed: 0 };
  if (!getApps().length) initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "vizhaone" });
  let sent = 0, failed = 0;
  for (let offset = 0; offset < devices.length; offset += 500) {
    const batch = devices.slice(offset, offset + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: batch.map(device => device.token), notification: { title, body }, data: { route },
      android: { notification: { channelId: "vizhaone_updates", icon: "ic_stat_notification", sound: "default" } },
    });
    sent += result.successCount;
    failed += result.failureCount;
    const invalid = result.responses.flatMap((response, index) =>
      ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(response.error?.code) ? [batch[index].token] : []);
    if (invalid.length) await query("DELETE FROM push_devices WHERE user_id=$1 AND token=ANY($2::text[])", [userId,invalid]);
  }
  return { sent, failed };
}
async function notifyBookingStatus(booking) {
  if (!booking?.user_id) return;
  try {
    await sendUserPush(booking.user_id, "Booking update", `Your booking is now ${String(booking.status).replace(/_/g, " ")}.`);
  } catch { console.warn("Booking push notification could not be delivered"); }
}
module.exports = { registerDevice, removeDevice, sendUserPush, notifyBookingStatus };
