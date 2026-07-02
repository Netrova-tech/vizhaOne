const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  adminPinSecret: process.env.ADMIN_PIN_SECRET || "",
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PIN_SECRET || "",
  adminPin: process.env.ADMIN_PIN || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "vizhaone/services",
  googleSheetWebhookUrl: process.env.GOOGLE_SHEET_WEBHOOK_URL || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
};
