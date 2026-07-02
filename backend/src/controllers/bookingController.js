const { createBooking, listBookings, updateBooking, deleteBooking } = require("../services/bookingService");

async function listBookingsController(_req, res, store) {
  const bookings = await listBookings(store);
  return res.json(bookings);
}

async function createBookingController(req, res, store) {
  try {
    const booking = await createBooking(store, req.body || {});
    return res.status(201).json(booking);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create booking" });
  }
}

async function updateBookingController(req, res, store) {
  const { id } = req.params;
  const updates = req.body || {};
  try {
    const booking = await updateBooking(store, id, updates);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json(booking);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update booking" });
  }
}

async function deleteBookingController(req, res, store) {
  const { id } = req.params;
  const deleted = await deleteBooking(store, id);
  if (!deleted) {
    return res.status(404).json({ error: "Booking not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listBookingsController,
  createBookingController,
  updateBookingController,
  deleteBookingController,
};
