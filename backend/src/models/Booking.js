const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    hallId: String,
    hallName: String,
    date: String,
    startDate: String,
    endDate: String,
    slot: String,
    price: Number,
    name: String,
    mobile: String,
    guests: String,
    message: String,
    status: { type: String, default: "pending" },
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
