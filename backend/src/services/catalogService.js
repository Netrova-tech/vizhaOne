const mongoose = require("mongoose");
const Category = require("../models/Category");
const Service = require("../models/Service");
const Hall = require("../models/Hall");
const EventPackage = require("../models/EventPackage");
const HallService = require("../models/HallService");

const catalogModels = {
  categories: Category,
  services: Service,
  halls: Hall,
  packages: EventPackage,
};

const sortByCreated = (items) =>
  [...items].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

function toClient(doc) {
  const item = doc.toObject ? doc.toObject() : { ...doc };
  delete item._id;
  delete item.__v;
  if (item.createdAt && !item.created_at) item.created_at = item.createdAt;
  delete item.createdAt;
  delete item.updatedAt;
  return item;
}

function tableFor(store, table) {
  const rows = store.get(table);
  if (!rows) throw new Error(`Unknown catalog table: ${table}`);
  return rows;
}

async function listCatalogItems(store, table) {
  const Model = catalogModels[table];
  if (mongoose.connection.readyState === 1 && Model) {
    const sort = table === "categories" ? { sort_order: 1, createdAt: -1 } : { createdAt: -1 };
    const docs = await Model.find().sort(sort).lean();
    return docs.map(toClient);
  }

  const rows = tableFor(store, table);
  return table === "categories"
    ? [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : sortByCreated(rows);
}

async function createCatalogItem(store, table, payload) {
  const idPrefix = table.slice(0, -1) || "item";
  const item = {
    id: payload.id || `${idPrefix}-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...payload,
  };

  const Model = catalogModels[table];
  if (mongoose.connection.readyState === 1 && Model) {
    const doc = await Model.create(item);
    return toClient(doc);
  }

  tableFor(store, table).unshift(item);
  return item;
}

async function updateCatalogItem(store, table, id, payload) {
  const Model = catalogModels[table];
  if (mongoose.connection.readyState === 1 && Model) {
    const doc = await Model.findOneAndUpdate({ id }, payload, { new: true, runValidators: true });
    return doc ? toClient(doc) : null;
  }

  const rows = tableFor(store, table);
  const index = rows.findIndex((item) => item.id === id);
  if (index === -1) return null;
  rows[index] = { ...rows[index], ...payload, id };
  return rows[index];
}

async function deleteCatalogItem(store, table, id) {
  const Model = catalogModels[table];
  if (mongoose.connection.readyState === 1 && Model) {
    const result = await Model.deleteOne({ id });
    return result.deletedCount > 0;
  }

  const rows = tableFor(store, table);
  const index = rows.findIndex((item) => item.id === id);
  if (index === -1) return false;
  rows.splice(index, 1);
  return true;
}

async function getCatalog(store) {
  const [categories, services, halls, packages] = await Promise.all([
    listCatalogItems(store, "categories"),
    listCatalogItems(store, "services"),
    listCatalogItems(store, "halls"),
    listCatalogItems(store, "packages"),
  ]);

  return { categories, services, halls, packages };
}

async function getLinkedServices(store, hallId) {
  if (mongoose.connection.readyState === 1 && HallService) {
    const docs = await HallService.find({ hall_id: hallId }).lean();
    return docs.map((doc) => doc.service_id);
  }

  const rows = tableFor(store, "hall_services");
  return rows.filter((item) => item.hall_id === hallId).map((item) => item.service_id);
}

async function saveLinkedServices(store, hallId, serviceIds) {
  if (mongoose.connection.readyState === 1 && HallService) {
    await HallService.deleteMany({ hall_id: hallId });
    if (serviceIds && serviceIds.length > 0) {
      const services = await Service.find({ id: { $in: serviceIds } }).lean();
        const docs = services.map((svc) => ({
          id: `link-${hallId}-${svc.id}`,
          hall_id: hallId,
          service_id: svc.id,
          title: svc.title,
          description: svc.description,
          price: svc.price,
          price_min: svc.price_min,
          price_max: svc.price_max,
          image_url: svc.image_url,
          gallery_urls: svc.gallery_urls,
          vendor_name: svc.vendor_name,
          vendor_mobile: svc.vendor_mobile,
          pincode: svc.pincode,
          location: svc.location,
          availability_status: svc.availability_status,
          place_name: svc.place_name,
        }));
      await HallService.insertMany(docs);
    }
    return serviceIds;
  }

  const rows = tableFor(store, "hall_services");
  // Remove existing links
  const filtered = rows.filter((item) => item.hall_id !== hallId);
  store.set("hall_services", filtered);
  // Add new links
  if (serviceIds && serviceIds.length > 0) {
    serviceIds.forEach((serviceId) => {
      store.push("hall_services", {
        id: `link-${hallId}-${serviceId}`,
        hall_id: hallId,
        service_id: serviceId,
      });
    });
  }
  return serviceIds;
}

module.exports = {
  getCatalog,
  listCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getLinkedServices,
  saveLinkedServices,
};
