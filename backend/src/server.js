const dns = require("dns");

// Configure Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { connectMongo } = require("./config/db");
const { port } = require("./config/env");
const { createApp } = require("./app");
const { createStore } = require("./utils/createStore");

const store = createStore();
const app = createApp({ store });

async function start() {
  try {
    await connectMongo();
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

start().then(() => {
  app.listen(port, "0.0.0.0", () => {
    console.log(`VizhaOne backend running on http://0.0.0.0:${port}`);
  });
});
