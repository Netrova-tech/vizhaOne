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
    const priceValue = Number(req.body.price);
    const price = Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null;

    if (!vendorName || phone.length !== 10 || !serviceName || !location) {
      return res.status(400).json({ error: "Name, valid 10-digit phone, service name and location are required" });
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
            vendor_mobile,location,place_name,availability_status,verified,pricing_type
          ) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$9,true,false,$10)
          RETURNING *
        `, [serviceId, vendor.id, categoryId, serviceName, description || null, price, businessName, phone, location, price ? "starting" : "quote"])).rows[0];

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
