const { getPool } = require("../db/pool");

async function connectDatabase() {
  await getPool().query("SELECT 1");
  await getPool().query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text");
  await getPool().query("ALTER TABLE services ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false");
  await getPool().query("ALTER TABLE reels ALTER COLUMN vendor_id DROP NOT NULL");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE CASCADE");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS service_name text");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'reel'");
  await getPool().query("CREATE INDEX IF NOT EXISTS reels_public_feed_idx ON reels(published,created_at DESC)");
  await getPool().query("CREATE INDEX IF NOT EXISTS reels_owner_idx ON reels(owner_id)");
}

module.exports = { connectDatabase };
