const { getPool } = require("../db/pool");

async function connectDatabase() {
  await getPool().query("SELECT 1");
  await getPool().query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text");
  await getPool().query("ALTER TABLE services ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false");
}

module.exports = { connectDatabase };
