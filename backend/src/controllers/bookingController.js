const { createBooking, createBulkBookings, listBookings, updateBooking, deleteBooking, submitBookingReview } = require("../services/bookingService");
const { mobileSession } = require("../services/authService");

async function listBookingsController(req, res, store) {
  const session = mobileSession(req);
  const bookings = await listBookings(store, { ...(req.query || {}), userId: session?.sub });
  return res.json(bookings);
}

async function createBookingController(req, res, store) {
  try {
    const booking = await createBooking(store, req.body || {}, mobileSession(req)?.sub);
    return res.status(201).json(booking);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create booking" });
  }
}
async function createBulkBookingsController(req,res,store){try{return res.status(201).json(await createBulkBookings(store,req.body||{},mobileSession(req)?.sub));}catch(error){return res.status(400).json({error:error instanceof Error?error.message:"Failed to create cart bookings"});}}

async function updateBookingController(req, res, store) {
  const { id } = req.params;
  const updates = req.body || {};
  try {
    const validStatuses = ["pending", "approved", "in_progress", "completed", "cancelled"];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({ error: "Invalid booking status" });
    }
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
async function submitBookingReviewController(req,res){try{const session=mobileSession(req);const review=await submitBookingReview(req.params.id,session?.sub,req.body||{});return res.status(201).json({success:true,review});}catch(error){return res.status(400).json({error:error instanceof Error?error.message:"Unable to save review"});}}

module.exports = {
  listBookingsController,
  createBookingController,
  createBulkBookingsController,
  updateBookingController,
  deleteBookingController,
  submitBookingReviewController,
};
