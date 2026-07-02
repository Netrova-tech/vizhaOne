const {
  createInquiry,
  getCrmStats,
  listInquiries,
  updateInquiryStatus,
  deleteInquiry,
  exportInquiries,
  getAnalytics,
} = require("../services/adminCrmService");

function sendError(res, error) {
  return res.status(error.status || 500).json({ error: error.message || "Server error" });
}

async function createInquiryController(req, res, store) {
  try {
    const inquiry = await createInquiry(store, req.body || {});
    return res.status(201).json(inquiry);
  } catch (error) {
    return sendError(res, error);
  }
}

async function crmStatsController(_req, res, store) {
  try {
    return res.json(await getCrmStats(store));
  } catch (error) {
    return sendError(res, error);
  }
}

async function crmInquiriesController(req, res, store) {
  try {
    return res.json(await listInquiries(store, req.query || {}));
  } catch (error) {
    return sendError(res, error);
  }
}

async function crmStatusController(req, res, store) {
  try {
    const inquiry = await updateInquiryStatus(store, req.params.id, req.body?.status);
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
    return res.json(inquiry);
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteInquiryController(req, res, store) {
  try {
    const deleted = await deleteInquiry(store, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Inquiry not found" });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error);
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function crmExportController(req, res, store) {
  try {
    const rows = await exportInquiries(store, req.query || {});
    const headers = ["Customer Name", "Phone Number", "Email", "Hall Name", "Status", "Created Date"];
    const delimiter = req.query.format === "excel" ? "\t" : ",";
    const body = [headers.join(delimiter), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(delimiter))].join("\n");
    const isExcel = req.query.format === "excel";
    res.setHeader("Content-Type", isExcel ? "application/vnd.ms-excel" : "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="vizhaone-crm.${isExcel ? "xls" : "csv"}"`);
    return res.send(body);
  } catch (error) {
    return sendError(res, error);
  }
}

async function analyticsController(_req, res, store) {
  try {
    return res.json(await getAnalytics(store));
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  createInquiryController,
  crmStatsController,
  crmInquiriesController,
  crmStatusController,
  deleteInquiryController,
  crmExportController,
  analyticsController,
};
