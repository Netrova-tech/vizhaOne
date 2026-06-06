const { trackSignup } = require("../services/signupService");

async function trackSignupController(req, res, store) {
  const { mobile } = req.body || {};
  if (!mobile) {
    return res.status(400).json({ error: "mobile required" });
  }

  try {
    const result = await trackSignup(store, req.body || {});
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
}

module.exports = {
  trackSignupController,
};
