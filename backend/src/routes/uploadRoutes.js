const express = require("express");
const multer = require("multer");
const { uploadCloudinaryImagesController } = require("../controllers/uploadController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
});

function createUploadRouter() {
  const router = express.Router();

  router.post("/cloudinary", upload.array("images", 8), uploadCloudinaryImagesController);

  return router;
}

module.exports = {
  createUploadRouter,
};
