function healthController(_req, res) {
  return res.json({
    ok: true,
    stack: "MERN",
    architecture: "MVC",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  healthController,
};
