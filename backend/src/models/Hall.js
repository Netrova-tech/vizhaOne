const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    address: String,
    pincode: String,
    location: String,
    price_per_day: Number,
    price_morning: Number,
    price_evening: Number,
    capacity: Number,
    dining_capacity: Number,
    parking_capacity: Number,
    rooms: Number,
    has_ac: { type: Boolean, default: false },
    has_parking: { type: Boolean, default: false },
    has_generator: { type: Boolean, default: false },
    has_catering: { type: Boolean, default: false },
    image_url: String,
    gallery_urls: [String],
    owner_mobile: String,
    owner_name: String,

    is_active: { type: Boolean, default: true },
    service_ids: [String],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.models.Hall || mongoose.model("Hall", hallSchema);
