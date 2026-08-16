const express = require("express");
const {
  getSessionController,
  logoutController,
  requestOtpController,
  updateAdminProfileController,
  verifyAdminPinController,
  superAdminLoginController,
  verifyOtpController,
  registerController,
  loginController,
  googleLoginController,
  mobileMeController,
  mobileProfileController,
  deleteMobileAccountController,
} = require("../controllers/authController");

function createAuthRouter({ store }) {
  const router = express.Router();

  router.get("/me", getSessionController);
  router.post("/logout", logoutController);
  router.post("/admin-pin", (req, res) => verifyAdminPinController(req, res, store));
  router.post("/super-admin/login", (req, res) => superAdminLoginController(req, res, store));
  router.put("/admin-profile", updateAdminProfileController);
  router.post("/request-otp", (req, res) => requestOtpController(req, res, store));
  router.post("/verify-otp", (req, res) => verifyOtpController(req, res, store));
  router.post("/register", registerController);
  router.post("/login", loginController);
  router.post("/google", googleLoginController);
  router.get("/mobile-me", mobileMeController);
  router.put("/profile", mobileProfileController);
  router.delete("/account", deleteMobileAccountController);

  return router;
}

module.exports = {
  createAuthRouter,
};
