const fs = require("node:fs");
const path = require("node:path");
const { BSON } = require("bson");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query, getPool } = require("./pool");

function readBson(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).size) return [];
  const data = fs.readFileSync(file);
  const docs = [];
  for (let offset = 0; offset + 4 <= data.length;) {
    const size = data.readInt32LE(offset);
    if (size < 5 || offset + size > data.length) throw new Error(`Invalid BSON document in ${file} at byte ${offset}`);
    docs.push(BSON.deserialize(data.subarray(offset, offset + size)));
    offset += size;
  }
  return docs;
}

const value = (input, fallback = null) => input === undefined || input === null || input === "" ? fallback : input;
const number = (input) => Number.isFinite(Number(input)) ? Number(input) : null;

async function migrate(root) {
  const categories = readBson(path.join(root, "categories.bson"));
  const services = readBson(path.join(root, "services.bson"));
  const halls = readBson(path.join(root, "halls.bson"));

  for (const item of categories) {
    await query(`INSERT INTO categories(id,name,image_url,description,icon,sort_order)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,image_url=EXCLUDED.image_url,
      description=EXCLUDED.description,icon=EXCLUDED.icon,sort_order=EXCLUDED.sort_order`, [
      String(item.id), value(item.category_name || item.name, "Category"), value(item.category_image || item.image_url),
      value(item.description), value(item.icon), number(item.sort_order) || 0,
    ]);
  }

  const categoryIds = new Set((await query("SELECT id FROM categories")).rows.map((row) => row.id));
  for (const item of services) {
    const categoryId = categoryIds.has(String(item.category_id)) ? String(item.category_id) : null;
    await query(`INSERT INTO services(id,category_id,title,description,price,price_min,price_max,image_url,gallery_urls,vendor_name,vendor_mobile,pincode,location,place_name,latitude,longitude,availability_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id,title=EXCLUDED.title,description=EXCLUDED.description,
      price=EXCLUDED.price,price_min=EXCLUDED.price_min,price_max=EXCLUDED.price_max,image_url=EXCLUDED.image_url,
      gallery_urls=EXCLUDED.gallery_urls,vendor_name=EXCLUDED.vendor_name,vendor_mobile=EXCLUDED.vendor_mobile,
      pincode=EXCLUDED.pincode,location=EXCLUDED.location,place_name=EXCLUDED.place_name,
      latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,availability_status=EXCLUDED.availability_status`, [
      String(item.id), categoryId, value(item.title, "Service"), value(item.description), number(item.price),
      number(item.price_min), number(item.price_max), value(item.image_url), Array.isArray(item.gallery_urls) ? item.gallery_urls : [],
      value(item.vendor_name), value(item.vendor_mobile), value(item.pincode), value(item.location), value(item.place_name),
      number(item.latitude), number(item.longitude), item.availability_status !== false,
    ]);
  }

  for (const item of halls) {
    await query(`INSERT INTO halls(id,name,description,address,pincode,location,latitude,longitude,price_per_day,price_morning,price_evening,capacity,dining_capacity,parking_capacity,rooms,has_ac,has_parking,has_generator,has_catering,image_url,gallery_urls,owner_mobile,owner_name,is_active)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,address=EXCLUDED.address,
      pincode=EXCLUDED.pincode,location=EXCLUDED.location,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
      price_per_day=EXCLUDED.price_per_day,price_morning=EXCLUDED.price_morning,price_evening=EXCLUDED.price_evening,
      capacity=EXCLUDED.capacity,dining_capacity=EXCLUDED.dining_capacity,parking_capacity=EXCLUDED.parking_capacity,
      rooms=EXCLUDED.rooms,has_ac=EXCLUDED.has_ac,has_parking=EXCLUDED.has_parking,has_generator=EXCLUDED.has_generator,
      has_catering=EXCLUDED.has_catering,image_url=EXCLUDED.image_url,gallery_urls=EXCLUDED.gallery_urls,
      owner_mobile=EXCLUDED.owner_mobile,owner_name=EXCLUDED.owner_name,is_active=EXCLUDED.is_active`, [
      String(item.id), value(item.name, "Hall"), value(item.description), value(item.address), value(item.pincode),
      value(item.location), number(item.latitude), number(item.longitude), number(item.price_per_day), number(item.price_morning),
      number(item.price_evening), number(item.capacity), number(item.dining_capacity), number(item.parking_capacity), number(item.rooms),
      Boolean(item.has_ac), Boolean(item.has_parking), Boolean(item.has_generator), Boolean(item.has_catering), value(item.image_url),
      Array.isArray(item.gallery_urls) ? item.gallery_urls : [], value(item.owner_mobile), value(item.owner_name), item.is_active !== false,
    ]);
  }

  console.log(JSON.stringify({ categories: categories.length, services: services.length, halls: halls.length }));
}

const root = process.argv[2];
if (!root) throw new Error("Usage: npm run db:migrate:mongo -- <mongodb-backup-folder>");
migrate(path.resolve(root)).then(() => getPool().end()).catch(async (error) => { console.error(error); await getPool().end(); process.exitCode = 1; });
