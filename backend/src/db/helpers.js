const { query } = require("./pool");

const TABLES = new Set(["categories", "services", "halls", "event_packages"]);
const COLUMNS = {
  categories: new Set(["id", "name", "image_url", "description", "icon", "sort_order"]),
  services: new Set(["id", "category_id", "title", "description", "price", "price_min", "price_max", "image_url", "gallery_urls", "video_urls", "vendor_name", "vendor_mobile", "pincode", "location", "place_name", "latitude", "longitude", "availability_status", "verified", "pricing_type", "price_unit", "packages", "extra_charges", "travel_charges", "advance_percentage", "cancellation_terms", "experience_years", "rating", "review_count", "response_time"]),
  halls: new Set(["id", "name", "description", "address", "pincode", "location", "latitude", "longitude", "price_per_day", "price_morning", "price_evening", "capacity", "dining_capacity", "parking_capacity", "rooms", "has_ac", "has_parking", "has_generator", "has_catering", "image_url", "gallery_urls", "owner_mobile", "owner_name", "is_active"]),
  event_packages: new Set(["id", "name", "description", "package_type", "total_price", "image_url", "is_active", "service_ids"]),
};

function assertTable(table) { if (!TABLES.has(table)) throw new Error(`Unknown catalog table: ${table}`); }
function normalizePayload(table, payload = {}) {
  assertTable(table);
  const source = { ...payload };
  if (table === "categories") { source.name = source.name || source.category_name; source.image_url = source.image_url || source.category_image; }
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => COLUMNS[table].has(key) && value !== undefined));
}
function catalogClient(table, row) {
  if (!row) return row;
  if (table === "categories") return { ...row, category_name: row.name, category_image: row.image_url };
  return row;
}
async function exists(table, id) { assertTable(table); const result = await query(`SELECT 1 FROM ${table} WHERE id=$1`, [id]); return result.rowCount > 0; }

module.exports = { query, assertTable, normalizePayload, catalogClient, exists };
