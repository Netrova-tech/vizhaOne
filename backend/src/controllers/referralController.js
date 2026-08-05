const { walletSummary } = require("../services/referralService");

async function getWalletController(req, res) {
  try { return res.json(await walletSummary(req.params.mobile)); }
  catch (error) { return res.status(error.status || 500).json({ error: error.message || "Server error" }); }
}

module.exports = { getWalletController };
