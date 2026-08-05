const express = require("express");
const { getWalletController } = require("../controllers/referralController");

function createReferralRouter() {
  const router = express.Router();
  router.get("/wallet/:mobile", getWalletController);
  return router;
}
module.exports = { createReferralRouter };
