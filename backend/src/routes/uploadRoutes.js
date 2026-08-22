const express = require("express");
const multer = require("multer");
const { uploadCloudinaryImagesController, uploadCloudinaryMediaController } = require("../controllers/uploadController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 15,
  },
});

function createUploadRouter() {
  const router = express.Router();

  router.post("/cloudinary", upload.array("images", 15), uploadCloudinaryImagesController);
  const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
  router.post("/media", mediaUpload.single("media"), uploadCloudinaryMediaController);

  return router;
}

module.exports = {
  createUploadRouter,
};
