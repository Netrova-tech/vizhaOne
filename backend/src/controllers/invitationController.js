const { createInvitation, getInvitation, addRsvp } = require("../services/invitationService");

const fail = (res, error) => res.status(error.status || 500).json({ error: error.message || "Server error" });

async function createInvitationController(req, res) {
  try { return res.status(201).json(await createInvitation(req.body || {})); } catch (error) { return fail(res, error); }
}
async function getInvitationController(req, res) {
  try {
    const invitation = await getInvitation(req.params.slug);
    return invitation ? res.json(invitation) : res.status(404).json({ error: "Invitation not found" });
  } catch (error) { return fail(res, error); }
}
async function addRsvpController(req, res) {
  try {
    const invitation = await addRsvp(req.params.slug, req.body || {});
    return invitation ? res.status(201).json({ success: true }) : res.status(404).json({ error: "Invitation not found" });
  } catch (error) { return fail(res, error); }
}

module.exports = { createInvitationController, getInvitationController, addRsvpController };
