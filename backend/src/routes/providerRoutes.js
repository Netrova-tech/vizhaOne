const express = require("express");
const crypto = require("node:crypto");
const { query, transaction } = require("../db/pool");
const { mobileSession } = require("../services/authService");

function providerSession(req, res) {
  const session = mobileSession(req);
  if (!session) {
    res.status(401).json({ error: "Sign in as a service provider to continue" });
    return null;
  }
  if (!["service_provider", "admin"].includes(session.role)) {
    res.status(403).json({ error: "Only service providers can publish services" });
    return null;
  }
  return session;
}

const clean = (value, maximum = 500) => String(value || "").trim().slice(0, maximum);
const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(-10);

function serviceClient(row) {
  return {
    ...row,
    listingStatus: row.availability_status ? "published" : "unpublished",
    verificationStatus: row.verified ? "verified" : "unverified",
  };
}

function createProviderRouter() {
  const router = express.Router();

  router.get("/dashboard", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    try {
      const vendor = (await query("SELECT * FROM vendors WHERE user_id=$1", [session.sub])).rows[0] || null;
      const services = vendor
        ? (await query("SELECT * FROM services WHERE vendor_id=$1 ORDER BY created_at DESC", [vendor.id])).rows.map(serviceClient)
        : [];
      return res.json({ vendor, services });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Unable to load provider profile" });
    }
  });

  router.get("/bookings", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    try {
      const result = await query(`
        SELECT b.*, s.title AS service_title
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN vendors v ON v.id = s.vendor_id
        WHERE v.user_id=$1
        ORDER BY b.created_at DESC
      `, [session.sub]);
      return res.json({ bookings: result.rows.map((row) => ({
        id: row.id,
        serviceId: row.service_id,
        serviceName: row.service_title || row.hall_name || "Service booking",
        customerName: row.customer_name,
        mobile: row.mobile,
        date: row.start_date || row.event_date,
        endDate: row.end_date,
        guests: row.guests,
        price: row.price == null ? null : Number(row.price),
        message: row.message || "",
        status: row.status,
        rejectionReason: row.rejection_reason || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Unable to load booking requests" });
    }
  });

  router.patch("/bookings/:id", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    const status = clean(req.body.status, 30);
    const reason = clean(req.body.rejectionReason, 500);
    if (!["approved", "rejected", "in_progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Unsupported booking status" });
    }
    if (["rejected", "cancelled"].includes(status) && !reason) {
      return res.status(400).json({ error: "Please provide a reason" });
    }
    try {
      const owned = await query(`SELECT b.id FROM bookings b JOIN services s ON s.id=b.service_id JOIN vendors v ON v.id=s.vendor_id WHERE b.id=$1 AND v.user_id=$2`, [req.params.id, session.sub]);
      if (!owned.rowCount) return res.status(404).json({ error: "Booking not found" });
      const result = await query("UPDATE bookings SET status=$1,rejection_reason=$2,updated_at=now() WHERE id=$3 RETURNING *", [status, reason || null, req.params.id]);
      const row = result.rows[0];
      return res.json({ id: row.id, status: row.status, rejectionReason: row.rejection_reason || "", updatedAt: row.updated_at });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Unable to update booking" });
    }
  });

  router.patch("/profile", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    const businessName = clean(req.body.businessName, 160);
    const phone = cleanPhone(req.body.phone);
    const location = clean(req.body.location, 220);
    const description = clean(req.body.description, 1000);
    if (!businessName || phone.length !== 10 || !location) return res.status(400).json({ error: "Business name, valid 10-digit phone and location are required" });
    try {
      const result = await query(`UPDATE vendors SET business_name=$1,phone=$2,location=$3,description=$4,updated_at=now() WHERE user_id=$5 RETURNING *`, [businessName, phone, location, description || null, session.sub]);
      if (!result.rowCount) return res.status(404).json({ error: "Create a service before editing your business profile" });
      await query("UPDATE users SET name=$1,mobile=$2,location=$3,updated_at=now() WHERE id=$4", [clean(req.body.name, 120) || businessName, phone, location, session.sub]);
      return res.json({ vendor: result.rows[0] });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to update profile" }); }
  });

  router.patch("/services/:id", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    const title = clean(req.body.title, 180);
    const description = clean(req.body.description, 1000);
    const priceValue = Number(req.body.price);
    const price = Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null;
    const availability = req.body.availability !== false;
    if (!title) return res.status(400).json({ error: "Service title is required" });
    try {
      const result = await query(`UPDATE services s SET title=$1,description=$2,price=$3,price_min=$3,pricing_type=$4,availability_status=$5,updated_at=now() FROM vendors v WHERE s.vendor_id=v.id AND v.user_id=$6 AND s.id=$7 RETURNING s.*`, [title, description || null, price, price ? "starting" : "quote", availability, session.sub, req.params.id]);
      if (!result.rowCount) return res.status(404).json({ error: "Service not found" });
      return res.json({ service: serviceClient(result.rows[0]) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to update service" }); }
  });

  router.post("/publish", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;

    const vendorName = clean(req.body.vendorName, 120);
    const businessName = clean(req.body.businessName, 160) || vendorName;
    const phone = cleanPhone(req.body.phone);
    const serviceName = clean(req.body.serviceName, 180);
    const location = clean(req.body.location, 220);
    const description = clean(req.body.description, 1000);
    const categoryName = clean(req.body.category, 100);
    const imageUrls = [...new Set((Array.isArray(req.body.imageUrls) ? req.body.imageUrls : []).map((value) => clean(value, 1000)).filter((value) => /^https:\/\//i.test(value)))].slice(0, 5);
    const videoUrls = [...new Set((Array.isArray(req.body.videoUrls) ? req.body.videoUrls : []).map((value) => clean(value, 1000)).filter((value) => /^https:\/\//i.test(value)))].slice(0, 1);
    const priceValue = Number(req.body.price);
    const price = Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null;

    if (!vendorName || phone.length !== 10 || !serviceName || !location) {
      return res.status(400).json({ error: "Name, valid 10-digit phone, service name and location are required" });
    }
    if (imageUrls.length < 1) {
      return res.status(400).json({ error: "Upload at least 1 service image (maximum 5)" });
    }

    try {
      const result = await transaction(async (client) => {
        const account = (await client.query("SELECT id,role FROM users WHERE id=$1 FOR UPDATE", [session.sub])).rows[0];
        if (!account || !["service_provider", "admin"].includes(account.role)) throw Object.assign(new Error("Provider account not found"), { status: 403 });

        const vendor = (await client.query(`
          INSERT INTO vendors(user_id,business_name,description,phone,location,verified)
          VALUES($1,$2,$3,$4,$5,false)
          ON CONFLICT(user_id) DO UPDATE SET
            business_name=EXCLUDED.business_name, description=EXCLUDED.description,
            phone=EXCLUDED.phone, location=EXCLUDED.location, updated_at=now()
          RETURNING *
        `, [session.sub, businessName, description || null, phone, location])).rows[0];

        let categoryId = null;
        if (categoryName) {
          categoryId = (await client.query("SELECT id FROM categories WHERE lower(name)=lower($1) LIMIT 1", [categoryName])).rows[0]?.id || null;
        }

        const serviceId = `service-${crypto.randomUUID()}`;
        const service = (await client.query(`
          INSERT INTO services(
            id,vendor_id,category_id,title,description,price,price_min,vendor_name,
            vendor_mobile,location,place_name,image_url,gallery_urls,video_urls,
            availability_status,verified,pricing_type
          ) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$9,$10,$11,$12,true,false,$13)
          RETURNING *
        `, [serviceId, vendor.id, categoryId, serviceName, description || null, price, businessName, phone, location, imageUrls[0], imageUrls, videoUrls, price ? "starting" : "quote"])).rows[0];

        return { vendor, service: serviceClient(service) };
      });

      return res.status(201).json({
        success: true,
        message: "Your profile and service were published successfully",
        ...result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || "Unable to publish service" });
    }
  });

  return router;
}

module.exports = { createProviderRouter };
