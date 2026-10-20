const express = require("express");
const crypto = require("node:crypto");
const { query, transaction } = require("../db/pool");
const { syncBookingReward } = require("../services/referralService");
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

  router.patch("/services/:id", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    const p = req.body || {};
    const title = clean(p.title, 180), location = clean(p.location, 220);
    const phone = cleanPhone(p.vendor_mobile), price = p.price === "" || p.price == null ? null : Number(p.price);
    if (!title || !location || phone.length !== 10 || (price !== null && (!Number.isFinite(price) || price < 0)) || typeof p.availability_status !== "boolean") {
      return res.status(400).json({ error: "Valid title, location, phone, price and availability are required" });
    }
    try {
      const result = await query(`UPDATE services s SET title=$1,description=$2,location=$3,place_name=$3,
        vendor_name=$4,vendor_mobile=$5,price=$6,price_min=$6,availability_status=$7,
        pricing_type=$8,updated_at=now() FROM vendors v
        WHERE s.id=$9 AND s.vendor_id=v.id AND v.user_id=$10 RETURNING s.*`,
        [title,clean(p.description,1000),location,clean(p.vendor_name,160),phone,price,p.availability_status,price ? "starting" : "quote",req.params.id,session.sub]);
      if (!result.rowCount) return res.status(404).json({ error: "Service not found" });
      return res.json(serviceClient(result.rows[0]));
    } catch (error) { return res.status(500).json({ error: error.message }); }
  });

  router.get("/bookings", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    try {
      const bookings = (await query(`SELECT b.*,COALESCE(s.title,h.name) AS service_name FROM bookings b
        LEFT JOIN services s ON s.id=b.service_id LEFT JOIN halls h ON h.id=b.hall_id
        JOIN vendors v ON v.id=COALESCE(s.vendor_id,h.vendor_id)
        WHERE v.user_id=$1 ORDER BY b.created_at DESC`, [session.sub])).rows;
      return res.json(bookings);
    } catch (error) { return res.status(500).json({ error: error.message }); }
  });

  router.patch("/bookings/:id", async (req, res) => {
    const session = providerSession(req, res);
    if (!session) return;
    const status = req.body?.status, reason = clean(req.body?.rejectionReason,500);
    const transitions = { pending:["approved","cancelled"], approved:["in_progress","cancelled"], in_progress:["completed"] };
    if (!["approved","cancelled","in_progress","completed"].includes(status) || (status === "cancelled" && !reason)) {
      return res.status(400).json({ error: "Choose a valid status and give a reason when declining" });
    }
    try {
      const booking = await transaction(async client => {
        const current = (await client.query(`SELECT b.* FROM bookings b
          LEFT JOIN services s ON s.id=b.service_id LEFT JOIN halls h ON h.id=b.hall_id
          JOIN vendors v ON v.id=COALESCE(s.vendor_id,h.vendor_id)
          WHERE b.id=$1 AND v.user_id=$2 FOR UPDATE OF b`, [req.params.id,session.sub])).rows[0];
        if (!current) throw Object.assign(new Error("Booking not found"),{status:404});
        if (!transitions[current.status]?.includes(status)) throw Object.assign(new Error("Booking status has changed. Refresh and try again."),{status:409});
        if (status === "approved" && current.hall_id) {
          // Serialize acceptances for the same venue to prevent overlapping bookings.
          await client.query("SELECT id FROM halls WHERE id=$1 FOR UPDATE",[current.hall_id]);
          const conflict = await client.query(`SELECT id FROM bookings WHERE id<>$1 AND hall_id=$2
            AND status IN ('approved','in_progress','completed')
            AND COALESCE(start_date,event_date)<=COALESCE($4::date,$3::date)
            AND COALESCE(end_date,start_date,event_date)>=$3::date
            AND (slot=$5 OR slot='fullday' OR $5='fullday')`,
            [current.id,current.hall_id,current.start_date||current.event_date,current.end_date||current.start_date||current.event_date,current.slot||'fullday']);
          if (conflict.rowCount) throw Object.assign(new Error("This venue is already booked for that slot"),{status:409});
        }
        return (await client.query("UPDATE bookings SET status=$2,rejection_reason=$3,updated_at=now() WHERE id=$1 RETURNING *",[current.id,status,status==='cancelled'?reason:null])).rows[0];
      });
      await syncBookingReward(booking.id,status);
      return res.json(booking);
    } catch (error) { return res.status(error.status||500).json({ error: error.message }); }
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
