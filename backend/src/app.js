const express = require("express");
const cors = require("cors");
const { healthController } = require("./controllers/healthController");
const { createAuthRouter } = require("./routes/authRoutes");
const { createCatalogRouter } = require("./routes/catalogRoutes");
const { createBookingRouter } = require("./routes/bookingRoutes");
const { createSignupRouter } = require("./routes/signupRoutes");
const { createUploadRouter } = require("./routes/uploadRoutes");
const { createAdminRouter } = require("./routes/adminRoutes");

function createApp({ store }) {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN ||
     "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", healthController);
  app.use("/api/auth", createAuthRouter({ store }));
  app.use("/api/catalog", createCatalogRouter({ store }));
  app.use("/api/bookings", createBookingRouter({ store }));
  app.use("/api/admin", createAdminRouter({ store }));
  app.use("/api/track-signup", createSignupRouter({ store }));
  app.use("/api/uploads", createUploadRouter());

  return app;
}

module.exports = {
  createApp,
};
