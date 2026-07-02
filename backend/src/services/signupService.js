const mongoose = require("mongoose");
const Signup = require("../models/Signup");
const {
  googleSheetWebhookUrl,
  telegramBotToken,
  telegramChatId,
} = require("../config/env");

async function notifyGoogleSheet(record) {
  if (!googleSheetWebhookUrl) return;

  try {
    await fetch(googleSheetWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...record,
        platform: "VizhaOne",
      }),
    });
  } catch {
    console.warn("Google Sheet webhook failed");
  }
}

async function notifyTelegram(record) {
  if (!telegramBotToken || !telegramChatId) return;

  try {
    const message = [
      "New VizhaOne User!",
      `Mobile: ${record.mobile}`,
      `Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      `Source: ${record.source}`,
    ].join("\n");

    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
      }),
    });
  } catch {
    console.warn("Telegram notification failed");
  }
}

async function trackSignup(store, payload) {
  const record = {
    mobile: payload.mobile,
    timestamp: payload.timestamp || new Date().toISOString(),
    source: payload.source || "web",
  };

  if (mongoose.connection.readyState === 1) {
    await Signup.create(record);
  } else {
    store.push("signups", record);
  }

  await Promise.all([notifyGoogleSheet(record), notifyTelegram(record)]);

  return { success: true };
}

module.exports = {
  trackSignup,
};
