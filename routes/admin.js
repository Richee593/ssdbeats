const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// ✅ Cloudinary Upload Middlewares
const uploadArtist = require("../middlewares/uploadArtist");
const uploadAlbum = require("../middlewares/uploadAlbum");
const uploadSong = require("../middlewares/uploadSong");
const uploadNews = require("../middlewares/uploadNews");

// Controllers
const adminController = require("../controllers/adminController");
const artistController = require("../controllers/artistController");
const albumController = require("../controllers/albumController");
const songController = require("../controllers/songController");
const newsController = require("../controllers/newsController");
const pageController = require("../controllers/pageController");


// Middleware
const { requireAdmin } = require("../middleware/auth");

const Page = require("../models/Page");

// =========================
// LOGIN (PUBLIC)
// =========================
router.get("/login", adminController.loginPage);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again later."
});

router.post(
  "/login",
  loginLimiter,
  adminController.loginValidation,
  adminController.login
);


// =========================
// 🔒 PROTECT EVERYTHING BELOW
// =========================
router.use(requireAdmin);


// =========================
// DASHBOARD
// =========================
router.get("/dashboard", adminController.dashboard);


// =========================
// ☁️ CLOUDINARY STORAGE SETUPS
// =========================

// ARTIST IMAGE


// =========================
// ARTISTS
// =========================
router.get("/artists", artistController.getArtists);

router.get("/artists/create", artistController.createArtistPage);

router.post(
  "/artists/create",
  uploadArtist.single("image"),
  artistController.createArtist
);

router.get("/artists/edit/:id", artistController.editArtistPage);

router.post(
  "/artists/edit/:id",
  uploadArtist.single("image"),
  artistController.updateArtist
);

router.post("/artists/delete/:id", artistController.deleteArtist);


// =========================
// ALBUMS
// =========================
router.get("/albums", albumController.getAlbums);

router.get("/albums/create", albumController.createAlbumPage);

router.post(
  "/albums/create",
  uploadAlbum.single("cover"),
  albumController.createAlbum
);

router.get("/albums/edit/:id", albumController.editAlbumPage);

router.post(
  "/albums/edit/:id",
  uploadAlbum.single("cover"),
  albumController.updateAlbum
);

router.post("/albums/delete/:id", albumController.deleteAlbum);


// =========================
// SONGS
// =========================
router.get("/songs", songController.getSongs);

router.get("/songs/create", songController.createSongPage);

router.post(
  "/songs/create",
  uploadSong.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  songController.createSong
);

router.get("/songs/edit/:id", songController.editSongPage);

router.post(
  "/songs/edit/:id",
  uploadSong.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  songController.updateSong
);

router.post("/songs/delete/:id", songController.deleteSong);


// =========================
// NEWS
// =========================
router.get("/news", newsController.getNews);

router.get("/news/create", newsController.createNewsPage);

router.post(
  "/news/create",
  uploadNews.single("coverImage"),
  newsController.createNews
);

router.get("/news/edit/:id", newsController.editNewsPage);

router.post(
  "/news/edit/:id",
  uploadNews.single("coverImage"),
  newsController.updateNews
);

router.post("/news/delete/:id", newsController.deleteNews);



// ===============================
// PAGES
// ===============================
router.get("/pages", pageController.listPages);

router.get("/pages/edit/:id", pageController.editPageForm);

router.post("/pages/update/:id", pageController.updatePage);



// =========================
// LOGOUT
// =========================
router.get("/logout", adminController.logout);




module.exports = router;