const express = require("express");
const { query } = require("../db/pool");
const { mobileSession } = require("../services/authService");

const TYPES = new Set(["wedding", "birthday", "corporate", "engagement", "other"]);
const TEMPLATES = {
  wedding: [["Catering",30],["Decoration",20],["Photography",12],["Makeup",6],["Music",5],["Hall",17],["Other",10]],
  engagement: [["Catering",28],["Decoration",22],["Photography",15],["Makeup",8],["Music",5],["Hall",15],["Other",7]],
  birthday: [["Catering",30],["Decoration",20],["Photography",10],["Entertainment",12],["Cake",8],["Hall",12],["Other",8]],
  corporate: [["Catering",25],["Venue",25],["Audio Visual",18],["Photography",8],["Decoration",8],["Event Management",10],["Other",6]],
  other: [["Catering",28],["Venue",22],["Decoration",18],["Photography",12],["Music",8],["Other",12]],
};

function validate(body = {}) {
  const eventType = String(body.eventType || "").toLowerCase().trim();
  const location = String(body.location || "").trim().slice(0, 120);
  const eventDate = String(body.eventDate || "").trim();
  const guests = Number(body.guests), budget = Number(body.budget);
  if (!TYPES.has(eventType)) throw Object.assign(new Error("Choose a valid event type"), { status: 400 });
  if (location.length < 2) throw Object.assign(new Error("Enter a valid event location"), { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || new Date(eventDate + "T23:59:59") < new Date()) throw Object.assign(new Error("Choose a valid upcoming event date"), { status: 400 });
  if (!Number.isInteger(guests) || guests < 1 || guests > 100000) throw Object.assign(new Error("Guest count must be between 1 and 100,000"), { status: 400 });
  if (!Number.isFinite(budget) || budget < 1000 || budget > 100000000) throw Object.assign(new Error("Budget must be between ₹1,000 and ₹10 crore"), { status: 400 });
  return { eventType, location, eventDate, guests, budget: Math.round(budget) };
}

function deterministicPlan(input) {
  const rows = TEMPLATES[input.eventType] || TEMPLATES.other;
  let used = 0;
  return rows.map(function(row, index) {
    const amount = index === rows.length - 1 ? input.budget - used : Math.round(input.budget * row[1] / 100);
    used += amount;
    return { category: row[0], amount, reason: row[1] + "% allocation for " + row[0].toLowerCase() };
  });
}

async function llmPlan(input) {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_PLANNER_MODEL || "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Create a practical Indian event budget. Return JSON only: {allocations:[{category,amount,reason}]}. Use generic service categories. Never invent vendors. Positive integer amounts must sum exactly to total budget." }, { role: "user", content: JSON.stringify(input) }] }) });
  if (!response.ok) throw new Error("AI provider returned " + response.status);
  const body = await response.json();
  const parsed = JSON.parse(body && body.choices && body.choices[0] && body.choices[0].message.content || "{}");
  const source = Array.isArray(parsed.allocations) ? parsed.allocations : [];
  const cleaned = source.slice(0,10).map(function(x){ return { category:String(x.category||"").trim().slice(0,80), amount:Math.round(Number(x.amount)), reason:String(x.reason||"").trim().slice(0,180) }; }).filter(function(x){ return x.category && x.amount > 0; });
  if (!cleaned.length || cleaned.reduce(function(sum,x){return sum+x.amount;},0) !== input.budget) return null;
  return cleaned;
}

async function matchVendors(input, allocations) {
  const matches = [];
  for (const allocation of allocations.filter(function(x){ return x.category.toLowerCase() !== "other"; })) {
    const term = "%" + allocation.category.toLowerCase().replace(/\s+/g, "%") + "%", location = "%" + input.location.toLowerCase() + "%";
    const sql = "SELECT s.id,s.title,s.description,s.price,s.price_min,s.price_max,s.image_url,s.vendor_name,s.vendor_mobile,s.location,s.place_name,s.rating,s.review_count,s.verified,s.availability_status,c.name category_name FROM services s LEFT JOIN categories c ON c.id=s.category_id WHERE s.availability_status=true AND (lower(COALESCE(c.name,'')) LIKE $1 OR lower(s.title) LIKE $1 OR lower(COALESCE(s.description,'')) LIKE $1) ORDER BY (lower(COALESCE(s.location,'')) LIKE $2 OR lower(COALESCE(s.place_name,'')) LIKE $2) DESC,s.verified DESC,CASE WHEN COALESCE(s.price_min,s.price) IS NULL THEN 1 ELSE 0 END,ABS(COALESCE(s.price_min,s.price,$3)-$3),COALESCE(s.rating,0) DESC LIMIT 4";
    const result = await query(sql, [term, location, allocation.amount]);
    matches.push({ category: allocation.category, budget: allocation.amount, vendors: result.rows.map(function(row){ return { id:row.id,title:row.title,category:row.category_name,description:row.description,price:row.price==null?null:Number(row.price),priceMin:row.price_min==null?null:Number(row.price_min),priceMax:row.price_max==null?null:Number(row.price_max),imageUrl:row.image_url,vendorName:row.vendor_name,vendorMobile:row.vendor_mobile,location:row.location||row.place_name,rating:Number(row.rating||0),reviewCount:Number(row.review_count||0),verified:Boolean(row.verified),available:Boolean(row.availability_status) }; }) });
  }
  return matches;
}

function createAiPlannerRouter() {
  const router = express.Router();
  router.post("/event-plan", async function(req,res) {
    try {
      const session = mobileSession(req);
      if (!session) return res.status(401).json({ error:"Sign in as a customer to use AI Event Planner" });
      if (session.role !== "customer") return res.status(403).json({ error:"AI Event Planner is available for customer accounts" });
      const input = validate(req.body);
      let allocations = null, generatedBy = "smart-fallback";
      try { allocations = await llmPlan(input); if (allocations) generatedBy = "openai"; } catch (error) { console.error("AI planner fallback:", error.message); }
      allocations = allocations || deterministicPlan(input);
      const vendorMatches = await matchVendors(input, allocations);
      res.set("Cache-Control", "no-store");
      return res.json({ plan:Object.assign({},input,{ title:"Your " + input.eventType.charAt(0).toUpperCase() + input.eventType.slice(1) + " Plan",total:input.budget,allocations }),vendorMatches,generatedBy });
    } catch (error) { return res.status(error.status||500).json({ error:error.message||"Unable to generate event plan" }); }
  });
  return router;
}

module.exports = { createAiPlannerRouter, deterministicPlan, validate };
