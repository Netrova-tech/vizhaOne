const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectMongo() {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  });
}

module.exports = {
  connectMongo,
};
