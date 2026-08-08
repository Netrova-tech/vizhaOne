const { connectMongo } = require("./config/db");
const { port } = require("./config/env");
const { createApp } = require("./app");
const { createStore } = require("./utils/createStore");

const store = createStore();
const app = createApp({ store });

app.listen(port, "0.0.0.0", () => {
  console.log(`VizhaOne backend running on http://0.0.0.0:${port}`);

  connectMongo()
    .then(() => console.log("MongoDB connected successfully"))
    .catch((error) => {
      console.error("MongoDB connection failed; server will continue in limited mode:", error.message);
    });
});
