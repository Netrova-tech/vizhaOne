const { getUserActivity } = require("../services/userActivityService");
const { getAdminUserFromRequest } = require("../services/authService");
const express = require("express");
const {
  createInquiryController,
  crmStatsController,
  crmInquiriesController,
  crmStatusController,
  deleteInquiryController,
  crmExportController,
  analyticsController,
} = require("../controllers/adminCrmController");

function createAdminRouter({ store }) {
  const router = express.Router();

  router.get("/user-activity", async (req, res) => {
    try {
      const admin = await getAdminUserFromRequest(req);
      if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Admin access required" });
      res.set("Cache-Control", "no-store");
      return res.json(await getUserActivity());
    } catch (error) {
      return res.status(500).json({ error: error.message || "Unable to load user activity" });
    }
  });

  router.post("/crm/inquiries", (req, res) => createInquiryController(req, res, store));
  router.get("/crm/stats", (req, res) => crmStatsController(req, res, store));
  router.get("/crm/inquiries", (req, res) => crmInquiriesController(req, res, store));
  router.patch("/crm/inquiries/:id/status", (req, res) => crmStatusController(req, res, store));
  router.delete("/crm/inquiries/:id", (req, res) => deleteInquiryController(req, res, store));
  router.get("/crm/export", (req, res) => crmExportController(req, res, store));
  router.get("/analytics", (req, res) => analyticsController(req, res, store));

  return router;
}

module.exports = {
  createAdminRouter,
};
