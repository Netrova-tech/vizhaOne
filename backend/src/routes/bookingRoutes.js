const express = require("express");
const {
  listBookingsController,
  createBookingController,
  updateBookingController,
  deleteBookingController,
} = require("../controllers/bookingController");

function createBookingRouter({ store }) {
  const router = express.Router();

  router.get("/", (req, res) => listBookingsController(req, res, store));
  router.post("/", (req, res) => createBookingController(req, res, store));
  router.patch("/:id", (req, res) => updateBookingController(req, res, store));
  router.delete("/:id", (req, res) => deleteBookingController(req, res, store));

  return router;
}

module.exports = {
  createBookingRouter,
};
