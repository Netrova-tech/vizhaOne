const { getPool } = require("../db/pool");

async function connectDatabase() {
  await getPool().query("SELECT 1");
  await getPool().query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text");
  await getPool().query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL");
  await getPool().query("CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id)");
  await getPool().query(`UPDATE bookings b SET user_id=(
    SELECT u.id FROM users u
    WHERE regexp_replace(u.mobile,'[^0-9]','','g')=regexp_replace(b.mobile,'[^0-9]','','g')
    ORDER BY u.created_at ASC LIMIT 1
  ) WHERE b.user_id IS NULL AND EXISTS (
    SELECT 1 FROM users u
    WHERE regexp_replace(u.mobile,'[^0-9]','','g')=regexp_replace(b.mobile,'[^0-9]','','g')
  )`);
  await getPool().query("ALTER TABLE services ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false");
  await getPool().query("ALTER TABLE services ADD COLUMN IF NOT EXISTS food_preference text CHECK (food_preference IN ('pure-veg','veg-non-veg','non-veg'))");
  await getPool().query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'quote', ADD COLUMN IF NOT EXISTS price_unit text NOT NULL DEFAULT 'per event', ADD COLUMN IF NOT EXISTS packages jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS extra_charges text, ADD COLUMN IF NOT EXISTS travel_charges text, ADD COLUMN IF NOT EXISTS advance_percentage numeric(5,2), ADD COLUMN IF NOT EXISTS cancellation_terms text, ADD COLUMN IF NOT EXISTS experience_years integer, ADD COLUMN IF NOT EXISTS rating numeric(3,2), ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS response_time text, ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}'`);
  await getPool().query(`CREATE TABLE IF NOT EXISTS quote_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id text REFERENCES services(id) ON DELETE SET NULL, request_type text NOT NULL DEFAULT 'quote', customer_name text NOT NULL, mobile text NOT NULL, event_date date NOT NULL, location text NOT NULL, event_type text NOT NULL, guest_count integer, budget numeric(12,2), required_services text[] NOT NULL DEFAULT '{}', notes text, status text NOT NULL DEFAULT 'pending', quoted_amount numeric(12,2), admin_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
  await getPool().query("ALTER TABLE reels ALTER COLUMN vendor_id DROP NOT NULL");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE CASCADE");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS service_name text");
  await getPool().query("ALTER TABLE reels ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'reel'");
  await getPool().query("CREATE INDEX IF NOT EXISTS reels_public_feed_idx ON reels(published,created_at DESC)");
  await getPool().query("CREATE INDEX IF NOT EXISTS reels_owner_idx ON reels(owner_id)");
}

module.exports = { connectDatabase };
