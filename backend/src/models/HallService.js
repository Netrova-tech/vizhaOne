const mongoose = require("mongoose");

const hallServiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    hall_id: { type: String, required: true, index: true },
    service_id: { type: String, required: true, index: true },
    // Embedded service details for linked services
    title: String,
    description: String,
    price: Number,
    price_min: Number,
    price_max: Number,
    image_url: String,
    gallery_urls: [String],
    vendor_name: String,
    vendor_mobile: String,
    pincode: String,
    location: String,
    // New field for place name
    place_name: String,
    availability_status: { type: Boolean, default: true },

  },
  { timestamps: true }
);

module.exports = mongoose.models.HallService || mongoose.model("HallService", hallServiceSchema);
