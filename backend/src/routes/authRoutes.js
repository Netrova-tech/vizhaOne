const express = require("express");
const {
  getSessionController,
  logoutController,
  requestOtpController,
  updateAdminProfileController,
  verifyAdminPinController,
  verifyOtpController,
} = require("../controllers/authController");

function createAuthRouter({ store }) {
  const router = express.Router();

  router.get("/me", getSessionController);
  router.post("/logout", logoutController);
  router.post("/admin-pin", (req, res) => verifyAdminPinController(req, res, store));
  router.put("/admin-profile", updateAdminProfileController);
  router.post("/request-otp", (req, res) => requestOtpController(req, res, store));
  router.post("/verify-otp", (req, res) => verifyOtpController(req, res, store));

  return router;
}

module.exports = {
  createAuthRouter,
};
