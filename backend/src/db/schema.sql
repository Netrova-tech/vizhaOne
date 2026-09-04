CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), external_id text UNIQUE,
  role text NOT NULL DEFAULT 'customer' CHECK(role IN ('admin','customer','service_provider')),
  name text NOT NULL, email text UNIQUE, mobile text NOT NULL, password_hash text,
  location text, latitude double precision, longitude double precision,
  provider text NOT NULL DEFAULT 'email', avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_mobile_idx ON users(mobile);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL, description text, phone text NOT NULL, location text,
  latitude double precision, longitude double precision, verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY, name text NOT NULL, image_url text, description text, icon text,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY, vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL, title text NOT NULL,
  description text, price numeric(12,2), price_min numeric(12,2), price_max numeric(12,2),
  image_url text, gallery_urls text[] NOT NULL DEFAULT '{}', vendor_name text, vendor_mobile text,
  pincode text, location text, place_name text, latitude double precision, longitude double precision,
  availability_status boolean NOT NULL DEFAULT true, verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE services ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS food_preference text CHECK (food_preference IN ('pure-veg','veg-non-veg','non-veg'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'quote';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_unit text NOT NULL DEFAULT 'per event';
ALTER TABLE services ADD COLUMN IF NOT EXISTS packages jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS extra_charges text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS travel_charges text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS advance_percentage numeric(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_terms text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE services ADD COLUMN IF NOT EXISTS rating numeric(3,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS response_time text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category_id);
CREATE INDEX IF NOT EXISTS services_location_idx ON services(location);

CREATE TABLE IF NOT EXISTS halls (
  id text PRIMARY KEY, vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL, name text NOT NULL,
  description text, address text, pincode text, location text, latitude double precision, longitude double precision,
  price_per_day numeric(12,2), price_morning numeric(12,2), price_evening numeric(12,2), capacity integer,
  dining_capacity integer, parking_capacity integer, rooms integer, has_ac boolean DEFAULT false,
  has_parking boolean DEFAULT false, has_generator boolean DEFAULT false, has_catering boolean DEFAULT false,
  image_url text, gallery_urls text[] NOT NULL DEFAULT '{}', owner_mobile text, owner_name text,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS halls_location_idx ON halls(location);
CREATE TABLE IF NOT EXISTS hall_services (hall_id text REFERENCES halls(id) ON DELETE CASCADE, service_id text REFERENCES services(id) ON DELETE CASCADE, PRIMARY KEY(hall_id,service_id));

CREATE TABLE IF NOT EXISTS event_packages (
  id text PRIMARY KEY, name text NOT NULL, description text, package_type text,
  total_price numeric(12,2), image_url text, is_active boolean NOT NULL DEFAULT true,
  service_ids text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE SET NULL, hall_id text REFERENCES halls(id) ON DELETE SET NULL,
  service_id text REFERENCES services(id) ON DELETE SET NULL, hall_name text, event_date date, start_date date,
  end_date date, slot text, price numeric(12,2), customer_name text NOT NULL, mobile text NOT NULL,
  guests integer, message text, status text NOT NULL DEFAULT 'pending', rejection_reason text, referral_code text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_availability_idx ON bookings(hall_id,start_date,end_date,slot,status);

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id text REFERENCES services(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'quote' CHECK(request_type IN ('quote','booking')),
  customer_name text NOT NULL, mobile text NOT NULL, event_date date NOT NULL, location text NOT NULL,
  event_type text NOT NULL, guest_count integer, budget numeric(12,2), required_services text[] NOT NULL DEFAULT '{}',
  notes text, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','quoted','accepted','rejected','expired')),
  quoted_amount numeric(12,2), admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quote_requests_service_idx ON quote_requests(service_id,created_at DESC);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL, event_type text NOT NULL, custom_event_type text, primary_name text NOT NULL,
  secondary_name text, host_name text, event_date date NOT NULL, event_time time NOT NULL, venue text NOT NULL,
  map_url text, photo_url text, language text DEFAULT 'en', theme text DEFAULT 'rose', hashtag text,
  message text, premium boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name text NOT NULL, mobile text, attending boolean NOT NULL, guests integer DEFAULT 1,
  meal_preference text DEFAULT 'unspecified', message text, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  owner_mobile text UNIQUE NOT NULL, code text UNIQUE NOT NULL, points integer DEFAULT 0,
  total_referrals integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referral_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id uuid NOT NULL REFERENCES referral_wallets(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL, referred_mobile text NOT NULL, points integer DEFAULT 10,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now(), confirmed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS active_referred_mobile_idx ON referral_transactions(referred_mobile) WHERE status <> 'reversed';

CREATE TABLE IF NOT EXISTS planner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL, event_type text, event_date timestamptz, venue text, budget numeric(12,2),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES planner_events(id) ON DELETE CASCADE,
  title text NOT NULL, due_at timestamptz, completed boolean DEFAULT false, reminder_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES planner_events(id) ON DELETE CASCADE,
  name text NOT NULL, mobile text, family boolean DEFAULT false, guest_count integer DEFAULT 1,
  status text DEFAULT 'invited', reminder_one_day boolean DEFAULT true, reminder_ten_hours boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  media_url text NOT NULL, media_type text NOT NULL, caption text, service_id text REFERENCES services(id) ON DELETE SET NULL,
  service_name text, kind text NOT NULL DEFAULT 'reel' CHECK(kind IN ('reel','post')),
  price numeric(12,2), published boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE reels ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'reel';
ALTER TABLE reels ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
CREATE INDEX IF NOT EXISTS reels_public_feed_idx ON reels(published,created_at DESC);
CREATE INDEX IF NOT EXISTS reels_owner_idx ON reels(owner_id);
CREATE TABLE IF NOT EXISTS social_follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(follower_id,following_id), CHECK(follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS social_follows_following_idx ON social_follows(following_id);
CREATE TABLE IF NOT EXISTS social_reactions (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reel_id uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK(reaction IN ('like','save')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,reel_id,reaction)
);
CREATE INDEX IF NOT EXISTS social_reactions_reel_idx ON social_reactions(reel_id,reaction);
CREATE TABLE IF NOT EXISTS social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reel_id uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_comments_reel_idx ON social_comments(reel_id,created_at DESC);
CREATE TABLE IF NOT EXISTS saved_services (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE, service_id text REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(), PRIMARY KEY(user_id,service_id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL, body text NOT NULL, type text, read_at timestamptz, scheduled_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inquiries (
  id text PRIMARY KEY, customer_name text NOT NULL, customer_phone text NOT NULL, customer_email text,
  hall_id text REFERENCES halls(id) ON DELETE SET NULL, hall_name text, inquiry_source text DEFAULT 'whatsapp',
  status text DEFAULT 'interested', notes text, event_date date, event_start_date date, event_end_date date,
  slot text, expected_guests integer, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON inquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_pins (key text PRIMARY KEY DEFAULT 'primary', pin_hash text NOT NULL, salt text NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS signups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mobile text NOT NULL, source text DEFAULT 'web', created_at timestamptz DEFAULT now());

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['users','vendors','categories','services','halls','event_packages','bookings','invitations','referral_wallets','planner_events','inquiries','admin_pins'] LOOP EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I',t,t); EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',t,t); END LOOP; END $$;
