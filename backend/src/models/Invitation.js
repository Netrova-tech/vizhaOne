const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },
  attending: { type: Boolean, required: true },
  guests: { type: Number, min: 0, max: 20, default: 1 },
  mealPreference: { type: String, enum: ["veg", "non-veg", "unspecified"], default: "unspecified" },
  message: { type: String, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const invitationSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, enum: ["wedding", "birthday", "baby-shower", "other"], required: true },
  customEventType: { type: String, trim: true, maxlength: 60 },
  primaryName: { type: String, required: true, trim: true },
  secondaryName: { type: String, trim: true },
  hostName: { type: String, trim: true },
  eventDate: { type: String, required: true },
  eventTime: { type: String, required: true },
  venue: { type: String, required: true, trim: true },
  mapUrl: String,
  photoUrl: String,
  language: { type: String, enum: ["en", "ta"], default: "en" },
  theme: { type: String, default: "rose" },
  hashtag: String,
  message: { type: String, maxlength: 500 },
  premium: { type: Boolean, default: false },
  rsvps: [rsvpSchema],
}, { timestamps: true });

module.exports = mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
