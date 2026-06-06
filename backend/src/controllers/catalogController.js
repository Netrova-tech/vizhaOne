const {
  createCatalogItem,
  deleteCatalogItem,
  getCatalog,
  listCatalogItems,
  updateCatalogItem,
  getLinkedServices,
  saveLinkedServices,
} = require("../services/catalogService");

async function listCategoriesController(_req, res, store) {
  return res.json(await listCatalogItems(store, "categories"));
}

async function listServicesController(_req, res, store) {
  return res.json(await listCatalogItems(store, "services"));
}

async function listHallsController(_req, res, store) {
  return res.json(await listCatalogItems(store, "halls"));
}

async function listPackagesController(_req, res, store) {
  return res.json(await listCatalogItems(store, "packages"));
}

async function getCatalogController(_req, res, store) {
  return res.json(await getCatalog(store));
}

async function getHallServicesController(req, res, store) {
  try {
    const list = await getLinkedServices(store, req.params.hallId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function saveHallServicesController(req, res, store) {
  try {
    const { hallId, serviceIds } = req.body || {};
    if (!hallId) {
      return res.status(400).json({ error: "hallId is required" });
    }
    const list = await saveLinkedServices(store, hallId, serviceIds || []);
    return res.json({ success: true, serviceIds: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function createCrudControllers(table) {
  return {
    create: async (req, res, store) => {
      const item = await createCatalogItem(store, table, req.body || {});
      return res.status(201).json(item);
    },
    update: async (req, res, store) => {
      const item = await updateCatalogItem(store, table, req.params.id, req.body || {});
      if (!item) return res.status(404).json({ error: "Not found" });
      return res.json(item);
    },
    remove: async (req, res, store) => {
      const deleted = await deleteCatalogItem(store, table, req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.status(204).send();
    },
  };
}

module.exports = {
  listCategoriesController,
  listServicesController,
  listHallsController,
  listPackagesController,
  getCatalogController,
  createCrudControllers,
  getHallServicesController,
  saveHallServicesController,
};
