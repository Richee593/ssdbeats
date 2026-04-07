const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ssdbeats/news",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

module.exports = multer({ storage });