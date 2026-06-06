const express = require("express");
const { trackSignupController } = require("../controllers/signupController");

function createSignupRouter({ store }) {
  const router = express.Router();

  router.post("/", (req, res) => trackSignupController(req, res, store));

  return router;
}

module.exports = {
  createSignupRouter,
};
