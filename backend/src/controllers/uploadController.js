const crypto = require("node:crypto");
const {
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryCloudName,
  cloudinaryFolder,
} = require("../config/env");

function signCloudinaryParams(params) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${cloudinaryApiSecret}`).digest("hex");
}

async function uploadCloudinaryImagesController(req, res) {
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    return res.status(500).json({ error: "Cloudinary is not configured" });
  }

  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }
  if (files.length > 8) {
    return res.status(400).json({ error: "Maximum 8 images allowed" });
  }

  try {
    const uploads = await Promise.all(files.map(async (file) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = { folder: cloudinaryFolder, timestamp };
      const signature = signCloudinaryParams(params);
      const body = new FormData();

      body.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
      body.append("api_key", cloudinaryApiKey);
      body.append("folder", cloudinaryFolder);
      body.append("timestamp", String(timestamp));
      body.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        { method: "POST", body }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      return {
        publicId: result.public_id,
        url: result.secure_url,
      };
    }));

    return res.json({ images: uploads });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "Cloudinary upload failed",
    });
  }
}

module.exports = {
  uploadCloudinaryImagesController,
};
