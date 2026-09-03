const { query, assertTable, normalizePayload, catalogClient } = require("../db/helpers");
const { transaction } = require("../db/pool");

const dbTable = (table) => table === "packages" ? "event_packages" : table;

function validateServicePrice(payload = {}) {
  const startingRaw = payload.price_min ?? payload.price;
  const maximumRaw = payload.price_max;
  const startingBlank = startingRaw === undefined || startingRaw === null || startingRaw === "" || Number(startingRaw) === 0;
  const maximumBlank = maximumRaw === undefined || maximumRaw === null || maximumRaw === "" || Number(maximumRaw) === 0;

  // Empty and legacy zero values mean "Contact for quote" and are valid.
  if (startingBlank && maximumBlank) return;

  const startingPrice = startingBlank ? null : Number(startingRaw);
  const maximumPrice = maximumBlank ? null : Number(maximumRaw);
  if (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0)) {
    throw new Error("Service starting price must be a valid positive amount");
  }
  if (maximumPrice !== null && (!Number.isFinite(maximumPrice) || maximumPrice < 0)) {
    throw new Error("Service maximum price must be a valid positive amount");
  }
  if (startingPrice !== null && maximumPrice !== null) {
    if (maximumPrice < startingPrice) {
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
  if (actual === "services") validateServicePrice(payload);
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
