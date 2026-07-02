const mongoose = require("mongoose");

const eventPackageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    package_type: String,
    total_price: Number,
    image_url: String,
    is_active: { type: Boolean, default: true },
    service_ids: [String],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.models.EventPackage || mongoose.model("EventPackage", eventPackageSchema);
