const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");

function cleanSlug(value) {
  return String(value || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 45) || "event";
}

function toClient(doc) {
  const item = doc.toObject ? doc.toObject() : { ...doc };
  item.id = String(item._id || item.id);
  delete item._id;
  delete item.__v;
  return item;
}

async function createInvitation(payload) {
  const required = ["eventType", "primaryName", "eventDate", "eventTime", "venue"];
  if (required.some((key) => !String(payload[key] || "").trim())) {
    const error = new Error("Please complete all required invitation details");
    error.status = 400;
    throw error;
  }
  if (payload.eventType === "other" && !String(payload.customEventType || "").trim()) {
    const error = new Error("Please enter your celebration name");
    error.status = 400;
    throw error;
  }
  if (mongoose.connection.readyState !== 1) {
    const error = new Error("Database is not connected");
    error.status = 503;
    throw error;
  }
  const base = cleanSlug(`${payload.primaryName}-${payload.secondaryName || payload.eventType}`);
  const slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  const doc = await Invitation.create({ ...payload, slug, premium: false, rsvps: [] });
  return toClient(doc);
}

async function getInvitation(slug) {
  if (mongoose.connection.readyState !== 1) return null;
  const doc = await Invitation.findOne({ slug }).lean();
  return doc ? toClient(doc) : null;
}

async function addRsvp(slug, payload) {
  if (!String(payload.name || "").trim() || typeof payload.attending !== "boolean") {
    const error = new Error("Name and attendance response are required");
    error.status = 400;
    throw error;
  }
  const rsvp = {
    name: String(payload.name).trim(), mobile: String(payload.mobile || "").trim(),
    attending: payload.attending, guests: payload.attending ? Math.max(1, Math.min(Number(payload.guests) || 1, 20)) : 0,
    mealPreference: payload.mealPreference || "unspecified", message: String(payload.message || "").slice(0, 300),
  };
  const doc = await Invitation.findOneAndUpdate({ slug }, { $push: { rsvps: rsvp } }, { new: true });
  return doc ? toClient(doc) : null;
}

module.exports = { createInvitation, getInvitation, addRsvp };
