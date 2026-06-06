const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const RESERVED_BOOKING_STATUSES = new Set(["approved", "in_progress", "completed"]);

function isReservedStatus(status) {
  return RESERVED_BOOKING_STATUSES.has(status);
}

function isValidDateString(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBookingStartDate(booking) {
  return booking.startDate || booking.date || "";
}

function getBookingSlot(booking) {
  return booking.slot || "";
}

function slotsOverlap(slotA, slotB) {
  return slotA === slotB || slotA === "fullday" || slotB === "fullday";
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

function validateBookingDates(booking, { enforceFutureDate = true } = {}) {
  const bookingDate = getBookingStartDate(booking);
  const endDate = booking.endDate || "";

  if (!isValidDateString(bookingDate)) {
    throw new Error("A valid start date is required");
  }

  if (booking.date && !isValidDateString(booking.date)) {
    throw new Error("A valid booking date is required");
  }

  if (endDate && !isValidDateString(endDate)) {
    throw new Error("A valid end date is required");
  }

  if (enforceFutureDate) {
    const today = getTodayLocalDateString();
    if (bookingDate < today) {
      throw new Error("Past dates cannot be booked");
    }
  }

  if (endDate && endDate < bookingDate) {
    throw new Error("End date cannot be before start date");
  }
}

function bookingConflicts(candidate, existing) {
  if (!existing || existing.id === candidate.id) return false;
  if (!isReservedStatus(existing.status)) return false;
  if (existing.hallId !== candidate.hallId) return false;

  const candidateStart = getBookingStartDate(candidate);
  const candidateEnd = candidate.endDate || candidateStart;
  const existingStart = getBookingStartDate(existing);
  const existingEnd = existing.endDate || existingStart;
  if (!candidateStart || !candidateEnd || !existingStart || !existingEnd) return false;
  if (!rangesOverlap(candidateStart, candidateEnd, existingStart, existingEnd)) return false;

  return slotsOverlap(getBookingSlot(candidate), getBookingSlot(existing));
}

function ensureNoBookingConflict(candidate, bookings, ignoreBookingId) {
  const conflict = bookings.find((booking) => {
    if (ignoreBookingId && booking.id === ignoreBookingId) return false;
    return bookingConflicts(candidate, booking);
  });

  if (conflict) {
    throw new Error("This slot is already booked for the selected date");
  }
}

function toClient(doc) {
  const item = doc.toObject ? doc.toObject() : { ...doc };
  const mongoId = item._id ? item._id.toString() : undefined;

  item.id = item.id || mongoId;
  delete item._id;
  delete item.__v;

  return item;
}

async function listBookings(store) {
  if (mongoose.connection.readyState === 1) {
    const docs = await Booking.find().sort({ createdAt: -1 }).lean();
    return docs.map(toClient);
  }

  return store.get("bookings");
}

async function createBooking(store, payload) {
  const booking = {
    id: `booking-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload,
    status: "pending",
  };

  validateBookingDates(booking);

  if (mongoose.connection.readyState === 1) {
    const doc = await Booking.create(booking);
    return toClient(doc);
  }

  const bookings = store.get("bookings");
  store.push("bookings", booking);
  return booking;
}

async function updateBooking(store, bookingId, updates) {
  if (mongoose.connection.readyState === 1) {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { id: bookingId }] }
      : { id: bookingId };
    const currentDoc = await Booking.findOne(query).lean();
    if (!currentDoc) return null;

    const candidate = { ...toClient(currentDoc), ...updates };
    validateBookingDates(candidate, { enforceFutureDate: !["completed", "cancelled"].includes(candidate.status) });

    if (isReservedStatus(candidate.status)) {
      const existingBookings = await Booking.find({
        hallId: candidate.hallId,
        status: { $in: Array.from(RESERVED_BOOKING_STATUSES) },
      }).lean();
      ensureNoBookingConflict(candidate, existingBookings.map(toClient), candidate.id);
    }

    const doc = await Booking.findOneAndUpdate(query, updates, { new: true, runValidators: true }).lean();
    return doc ? toClient(doc) : null;
  }

  const bookings = store.get("bookings");
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return null;

  const candidate = { ...bookings[index], ...updates };
  validateBookingDates(candidate, { enforceFutureDate: !["completed", "cancelled"].includes(candidate.status) });

  if (isReservedStatus(candidate.status)) {
    ensureNoBookingConflict(candidate, bookings, bookingId);
  }

  bookings[index] = candidate;
  store.set("bookings", bookings);
  return bookings[index];
}

async function deleteBooking(store, bookingId) {
  if (mongoose.connection.readyState === 1) {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { id: bookingId }] }
      : { id: bookingId };
    const result = await Booking.deleteOne(query);
    return result.deletedCount > 0;
  }

  const bookings = store.get("bookings");
  const nextBookings = bookings.filter((b) => b.id !== bookingId);
  if (nextBookings.length === bookings.length) return false;

  store.set("bookings", nextBookings);
  return true;
}

module.exports = {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
};
