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
