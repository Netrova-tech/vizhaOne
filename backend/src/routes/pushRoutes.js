const express = require("express");
const { mobileSession } = require("../services/authService");
const { query } = require("../db/pool");
const { registerDevice, removeDevice } = require("../services/pushService");

function createPushRouter() {
  const router = express.Router();
  router.use(async (req, res, next) => {
    const session = mobileSession(req);
    if (!session) return res.status(401).json({ error: "Sign in to manage notifications" });
    try {
      const user = (await query("SELECT id FROM users WHERE id=$1", [session.sub])).rows[0];
      if (!user) return res.status(401).json({ error: "Account not found" });
      req.pushUserId = user.id;
      next();
    } catch { return res.status(500).json({ error: "Unable to verify account" }); }
  });
  const handle = fn => async (req, res) => {
    try { return res.json(await fn(req)); }
    catch (error) { return res.status(error.status || 500).json({ error: error.status ? error.message : "Unable to update notifications" }); }
  };
  router.post("/devices", handle(async req => {
    await registerDevice(req.pushUserId, req.body?.token, req.body?.platform);
    return { success: true };
  }));
  router.delete("/devices", handle(async req => {
    await removeDevice(req.pushUserId, req.body?.token);
    return { success: true };
  }));
  return router;
}
module.exports = { createPushRouter };
