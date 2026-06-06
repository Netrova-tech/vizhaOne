const express = require("express");
const {
  createCrudControllers,
  getCatalogController,
  listCategoriesController,
  listServicesController,
  listHallsController,
  listPackagesController,
  getHallServicesController,
  saveHallServicesController,
} = require("../controllers/catalogController");

function createCatalogRouter({ store }) {
  const router = express.Router();
  const category = createCrudControllers("categories");
  const service = createCrudControllers("services");
  const hall = createCrudControllers("halls");
  const eventPackage = createCrudControllers("packages");

  router.get("/", (req, res) => getCatalogController(req, res, store));
  router.get("/categories", (req, res) => listCategoriesController(req, res, store));
  router.post("/categories", (req, res) => category.create(req, res, store));
  router.put("/categories/:id", (req, res) => category.update(req, res, store));
  router.delete("/categories/:id", (req, res) => category.remove(req, res, store));

  router.get("/services", (req, res) => listServicesController(req, res, store));
  router.post("/services", (req, res) => service.create(req, res, store));
  router.put("/services/:id", (req, res) => service.update(req, res, store));
  router.delete("/services/:id", (req, res) => service.remove(req, res, store));

  router.get("/halls", (req, res) => listHallsController(req, res, store));
  router.post("/halls", (req, res) => hall.create(req, res, store));
  router.put("/halls/:id", (req, res) => hall.update(req, res, store));
  router.delete("/halls/:id", (req, res) => hall.remove(req, res, store));

  router.get("/packages", (req, res) => listPackagesController(req, res, store));
  router.post("/packages", (req, res) => eventPackage.create(req, res, store));
  router.put("/packages/:id", (req, res) => eventPackage.update(req, res, store));
  router.delete("/packages/:id", (req, res) => eventPackage.remove(req, res, store));

  router.get("/hall-services/:hallId", (req, res) => getHallServicesController(req, res, store));
  router.post("/hall-services", (req, res) => saveHallServicesController(req, res, store));

  return router;
}

module.exports = {
  createCatalogRouter,
};
