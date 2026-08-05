const express = require("express");
const { createInvitationController, getInvitationController, addRsvpController } = require("../controllers/invitationController");

function createInvitationRouter() {
  const router = express.Router();
  router.post("/", createInvitationController);
  router.get("/:slug", getInvitationController);
  router.post("/:slug/rsvp", addRsvpController);
  return router;
}
module.exports = { createInvitationRouter };
