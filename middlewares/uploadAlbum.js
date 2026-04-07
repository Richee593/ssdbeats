// middlewares/uploadAlbum.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ssdbeats/albums",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const uploadAlbum = multer({ storage });

module.exports = uploadAlbum;