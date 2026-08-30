const { query, assertTable, normalizePayload, catalogClient } = require("../db/helpers");
const { transaction } = require("../db/pool");

const dbTable = (table) => table === "packages" ? "event_packages" : table;

function validateServicePrice(payload = {}, { required = false } = {}) {
  const hasPriceUpdate = ["price", "price_min", "price_max"].some((key) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  );
  if (!required && !hasPriceUpdate) return;

  const startingPrice = Number(payload.price_min ?? payload.price);
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
    throw new Error("A valid service starting price greater than 0 is required");
  }

  if (payload.price_max !== undefined && payload.price_max !== null && payload.price_max !== "") {
    const maximumPrice = Number(payload.price_max);
    if (!Number.isFinite(maximumPrice) || maximumPrice < startingPrice) {
      throw new Error("Service maximum price must be greater than or equal to its starting price");
    }
  }
}

async function listCatalogItems(_store, table) {
  const actual = dbTable(table); assertTable(actual);
  const order = actual === "categories" ? "sort_order ASC, created_at DESC" : "created_at DESC";
  const result = await query(`SELECT * FROM ${actual} ORDER BY ${order}`);
  return result.rows.map((row) => catalogClient(actual, row));
}

async function createCatalogItem(_store, table, payload) {
  const actual = dbTable(table); assertTable(actual);
  if (actual === "services") validateServicePrice(payload, { required: true });
  const idPrefix = table.slice(0, -1) || "item";
  const item = normalizePayload(actual, { ...payload, id: payload.id || `${idPrefix}-${Date.now()}` });
  const keys = Object.keys(item);
  const values = Object.values(item);
  const result = await query(
    `INSERT INTO ${actual} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
    values
  );
  return catalogClient(actual, result.rows[0]);
}

async function updateCatalogItem(_store, table, id, payload) {
  const actual = dbTable(table); assertTable(actual);
  if (actual === "services") validateServicePrice(payload);
  const item = normalizePayload(actual, payload); delete item.id;
  const keys = Object.keys(item);
  if (!keys.length) { const current = await query(`SELECT * FROM ${actual} WHERE id=$1`, [id]); return catalogClient(actual, current.rows[0] || null); }
  const values = Object.values(item);
  const result = await query(`UPDATE ${actual} SET ${keys.map((key, i) => `${key}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1} RETURNING *`, [...values, id]);
  return catalogClient(actual, result.rows[0] || null);
}

async function deleteCatalogItem(_store, table, id) {
  const actual = dbTable(table); assertTable(actual);
  return (await query(`DELETE FROM ${actual} WHERE id=$1`, [id])).rowCount > 0;
}

async function getCatalog(store) {
  const [categories, services, halls, packages] = await Promise.all(["categories", "services", "halls", "packages"].map((table) => listCatalogItems(store, table)));
  return { categories, services, halls, packages };
}

async function getLinkedServices(_store, hallId) {
  return (await query("SELECT service_id FROM hall_services WHERE hall_id=$1 ORDER BY service_id", [hallId])).rows.map((row) => row.service_id);
}

async function saveLinkedServices(_store, hallId, serviceIds = []) {
  const unique = [...new Set(serviceIds)];
  await transaction(async (client) => {
    await client.query("DELETE FROM hall_services WHERE hall_id=$1", [hallId]);
    for (const serviceId of unique) await client.query("INSERT INTO hall_services(hall_id,service_id) VALUES($1,$2)", [hallId, serviceId]);
  });
  return unique;
}

module.exports = { getCatalog, listCatalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem, getLinkedServices, saveLinkedServices };
