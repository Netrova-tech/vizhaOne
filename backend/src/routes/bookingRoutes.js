const express = require("express");
const {
  listBookingsController,
  createBookingController,
  createBulkBookingsController,
  updateBookingController,
  deleteBookingController,
  submitBookingReviewController,
} = require("../controllers/bookingController");

function createBookingRouter({ store }) {
  const router = express.Router();

  router.get("/", (req, res) => listBookingsController(req, res, store));
  router.post("/", (req, res) => createBookingController(req, res, store));
  router.post("/bulk", (req, res) => createBulkBookingsController(req, res, store));
  router.post("/:id/review", submitBookingReviewController);
  router.patch("/:id", (req, res) => updateBookingController(req, res, store));
  router.delete("/:id", (req, res) => deleteBookingController(req, res, store));

  return router;
}

module.exports = {
  createBookingRouter,
};
