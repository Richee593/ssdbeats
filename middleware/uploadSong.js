const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 🎵 AUDIO STORAGE
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ssdbeats/songs",
    resource_type: "video", // 🔥 IMPORTANT for audio
    allowed_formats: ["mp3", "wav", "m4a"],
  },
});

// 🖼️ COVER STORAGE
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ssdbeats/song-covers",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// 🎯 CUSTOM ENGINE
const storage = {
  _handleFile(req, file, cb) {
    if (file.fieldname === "audioFile") {
      audioStorage._handleFile(req, file, cb);
    } else if (file.fieldname === "coverImage") {
      imageStorage._handleFile(req, file, cb);
    }
  },

  _removeFile(req, file, cb) {
    cb(null);
  }
};

module.exports = multer({ storage });