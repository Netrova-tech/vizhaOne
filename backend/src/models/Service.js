const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    category_id: String,
    title: { type: String, required: true, trim: true },
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
  { timestamps: true, strict: false }
);

module.exports = mongoose.models.Service || mongoose.model("Service", serviceSchema);
