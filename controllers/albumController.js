const Album = require("../models/Album");
const Artist = require("../models/Artist");
const Song = require("../models/Song");
const Genre = require("../models/Genre");
const cloudinary = require("../config/cloudinary");


// =========================
// GET ALL ALBUMS
// =========================
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate("artist", "name")
      .populate("genre", "name")
      .sort({ createdAt: -1 });

    res.render("admin/albums/index", {
      title: "Albums",
      albums
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// =========================
// CREATE PAGE
// =========================
exports.createAlbumPage = async (req, res) => {
  try {
    const artists = await Artist.find();
    const genres = await Genre.find();

    res.render("admin/albums/create", {
      title: "Create Album",
      artists,
      genres,
    });

  } catch (err) {
    console.error(err);
    res.redirect("/admin/albums");
  }
};


// =========================
// CREATE ALBUM
// =========================
exports.createAlbum = async (req, res) => {
  try {
    const { title, artist, genre, releaseDate } = req.body;

    // ☁️ Cloudinary cover
    const cover = req.file ? req.file.path : null;

    await Album.create({
      title,
      artist,
      genre,
      releaseDate: releaseDate || null,
      cover
    });

    req.flash("success", "Album created successfully 💿");
    res.redirect("/admin/albums");

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to create album");
    res.redirect("/admin/albums/create");
  }
};


// =========================
// EDIT PAGE
// =========================
exports.editAlbumPage = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("artist")
      .populate("genre");

    const artists = await Artist.find();
    const genres = await Genre.find();

    if (!album) {
      req.flash("error", "Album not found");
      return res.redirect("/admin/albums");
    }

    res.render("admin/albums/edit", {
      title: `Edit Album - ${album.title}`,
      album,
      artists,
      genres,
    });

  } catch (err) {
    console.error(err);
    res.redirect("/admin/albums");
  }
};


// =========================
// UPDATE ALBUM
// =========================
exports.updateAlbum = async (req, res) => {
  try {
    const { title, artist, genre, releaseDate } = req.body;

    const album = await Album.findById(req.params.id);

    if (!album) {
      req.flash("error", "Album not found");
      return res.redirect("/admin/albums");
    }

    const data = {
      title,
      artist,
      genre,
      releaseDate
    };

    // ☁️ If new cover uploaded
    if (req.file) {

      // 🔥 delete old cover from Cloudinary
      if (album.cover) {
        const publicId = album.cover.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`ssdbeats/albums/${publicId}`);
      }

      data.cover = req.file.path;
    }

    await Album.findByIdAndUpdate(req.params.id, data);

    req.flash("success", "Album updated successfully ✏️");
    res.redirect("/admin/albums");

  } catch (err) {
    console.error(err);
    req.flash("error", "Update failed");
    res.redirect("/admin/albums");
  }
};


// =========================
// DELETE ALBUM
// =========================
exports.deleteAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;

    const album = await Album.findById(albumId);

    if (!album) {
      req.flash("error", "Album not found");
      return res.redirect("/admin/albums");
    }

    // ❌ Prevent delete if used in songs
    const songsCount = await Song.countDocuments({ album: albumId });

    if (songsCount > 0) {
      req.flash("error", `Cannot delete. Used in ${songsCount} song(s).`);
      return res.redirect("/admin/albums");
    }

    // ☁️ delete cover from Cloudinary
    if (album.cover) {
      const publicId = album.cover.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ssdbeats/albums/${publicId}`);
    }

    await Album.findByIdAndDelete(albumId);

    req.flash("success", "Album deleted successfully 🗑️");
    res.redirect("/admin/albums");

  } catch (err) {
    console.error(err);
    req.flash("error", "Delete failed");
    res.redirect("/admin/albums");
  }
};