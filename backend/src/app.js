const express = require("express");
const cors = require("cors");
const { healthController } = require("./controllers/healthController");
const { createAuthRouter } = require("./routes/authRoutes");
const { createCatalogRouter } = require("./routes/catalogRoutes");
const { createBookingRouter } = require("./routes/bookingRoutes");
const { createSignupRouter } = require("./routes/signupRoutes");
const { createUploadRouter } = require("./routes/uploadRoutes");
const { createAdminRouter } = require("./routes/adminRoutes");
const { createInvitationRouter } = require("./routes/invitationRoutes");
const { createReferralRouter } = require("./routes/referralRoutes");
const { createSocialRouter } = require("./routes/socialRoutes");
const { createQuoteRouter } = require("./routes/quoteRoutes");
const { createProviderRouter } = require("./routes/providerRoutes");
const { createAiPlannerRouter } = require("./routes/aiPlannerRoutes");

function createApp({ store }) {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN ||
     "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  const nativeAppOrigins = new Set([
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
  ]);
  app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (nativeAppOrigins.has(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production") {
        try {
          const { hostname } = new URL(origin);
          const isLocalDev =
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172.");

          if (isLocalDev) return callback(null, true);
        } catch {
          // Fall through to the CORS error below.
        }
      }
      callback(new Error("Not allowed by CORS"));
    },
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", healthController);
  app.get("/api/app-config", (_req, res) => {
    const updateEnabled = process.env.ANDROID_UPDATE_ENABLED === "true";
    const configuredVersionCode = Number(
      process.env.ANDROID_LATEST_VERSION_CODE || 0,
    );
    res.set("Cache-Control", "no-store");
    res.json({
      android: {
        updateEnabled,
        latestVersionCode:
          updateEnabled && configuredVersionCode > 0
            ? configuredVersionCode
            : 0,
        latestVersionName: process.env.ANDROID_LATEST_VERSION_NAME || "",
        forceUpdate:
          updateEnabled && process.env.ANDROID_FORCE_UPDATE === "true",
        storeUrl:
          process.env.ANDROID_STORE_URL ||
          "https://play.google.com/store/apps/details?id=com.vizhaone.app",
        message:
          process.env.ANDROID_UPDATE_MESSAGE ||
          "A new VizhaOne update is ready with improvements and important fixes.",
      },
    });
  });
  app.use("/api/auth", createAuthRouter({ store }));
  app.use("/api/catalog", createCatalogRouter({ store }));
  app.use("/api/bookings", createBookingRouter({ store }));
  app.use("/api/quotes", createQuoteRouter());
  app.use("/api/admin", createAdminRouter({ store }));
  app.use("/api/track-signup", createSignupRouter({ store }));
  app.use("/api/uploads", createUploadRouter());
  app.use("/api/invitations", createInvitationRouter());
  app.use("/api/referrals", createReferralRouter());
  app.use("/api/social", createSocialRouter());
  app.use("/api/provider", createProviderRouter());
  app.use("/api/ai", createAiPlannerRouter());

  return app;
}

module.exports = {
  createApp,
};
