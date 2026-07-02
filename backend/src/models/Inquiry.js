const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, trim: true },
    hallId: { type: String, index: true },
    hallName: { type: String, trim: true, index: true },
    inquirySource: { type: String, default: "whatsapp", index: true },
    status: {
      type: String,
      enum: ["interested", "contacted", "confirmed", "dropped"],
      default: "interested",
      index: true,
    },
    notes: String,
    eventDate: String,
    eventStartDate: String,
    eventEndDate: String,
    slot: String,
    expectedGuests: String,
  },
  { timestamps: true, strict: false }
);

inquirySchema.index({ customerName: "text", customerPhone: "text", hallName: "text" });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
