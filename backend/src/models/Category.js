const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    category_name: { type: String, required: true, trim: true },
    category_image: String,
    description: String,
    icon: String,
    sort_order: Number,
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
