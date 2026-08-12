function healthController(_req, res) {
  return res.json({
    ok: true,
    stack: "Next.js + Node.js + PostgreSQL",
    architecture: "MVC",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  healthController,
};
