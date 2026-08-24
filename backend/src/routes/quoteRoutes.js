const express = require("express");
const { query } = require("../db/pool");

function createQuoteRouter() {
  const router = express.Router();
  router.get("/", async (_req, res) => {
    try {
      const result = await query(`SELECT q.*, s.title AS service_name FROM quote_requests q LEFT JOIN services s ON s.id=q.service_id ORDER BY q.created_at DESC`);
      res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
  });
  router.post("/", async (req, res) => {
    try {
      const p = req.body || {};
      if (!p.serviceId || !p.customerName || !p.mobile || !p.eventDate || !p.location || !p.eventType) return res.status(400).json({ error: "Service, name, mobile, event date, location and event type are required" });
      const result = await query(`INSERT INTO quote_requests(service_id,request_type,customer_name,mobile,event_date,location,event_type,guest_count,budget,required_services,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [p.serviceId,p.requestType === "booking" ? "booking" : "quote",p.customerName,p.mobile,p.eventDate,p.location,p.eventType,p.guestCount ? Number(p.guestCount) : null,p.budget ? Number(p.budget) : null,Array.isArray(p.requiredServices) ? p.requiredServices : [],p.notes || null]);
      res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const { status, quotedAmount, adminNotes } = req.body || {};
      const result = await query(`UPDATE quote_requests SET status=COALESCE($2,status), quoted_amount=COALESCE($3,quoted_amount), admin_notes=COALESCE($4,admin_notes) WHERE id=$1 RETURNING *`, [req.params.id,status || null,quotedAmount || null,adminNotes || null]);
      if (!result.rowCount) return res.status(404).json({ error: "Quote request not found" });
      res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
  });
  return router;
}
module.exports = { createQuoteRouter };
