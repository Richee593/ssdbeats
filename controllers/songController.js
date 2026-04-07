const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Genre = require("../models/Genre");
const cloudinary = require("../config/cloudinary");


// =========================
// GET ALL SONGS
// =========================
exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.find()
      .populate("artist", "name")
      .populate("mainArtist", "name")
      .populate("featuredArtists", "name")
      .populate("album", "title")
      .populate("genre", "name")
      .sort({ createdAt: -1 });

    res.render("admin/songs/index", {
      title: "All Songs",
      songs
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// =========================
// TOGGLE FEATURE
// =========================
exports.toggleFeature = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    song.isFeatured = !song.isFeatured;
    await song.save();

    res.json({ isFeatured: song.isFeatured });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Toggle failed" });
  }
};


// =========================
// CREATE PAGE
// =========================
exports.createSongPage = async (req, res) => {
  try {
    const artists = await Artist.find();
    const albums = await Album.find();
    const genres = await Genre.find();

    res.render("admin/songs/create", {
      artists,
      albums,
      genres
    });

  } catch (err) {
    console.error(err);
    res.redirect("/admin/songs");
  }
};


// =========================
// CREATE SONG
// =========================
exports.createSong = async (req, res) => {
  try {
    let {
      title,
      artist,
      mainArtist,
      featuredArtists,
      album,
      genre,
      releaseDate
    } = req.body;

    // normalize featured artists
    if (!featuredArtists) featuredArtists = [];
    if (!Array.isArray(featuredArtists)) {
      featuredArtists = [featuredArtists];
    }

    // ☁️ Cloudinary URLs
    const audioFile = req.files["audioFile"]
      ? req.files["audioFile"][0].path
      : null;

    const coverImage = req.files["coverImage"]
      ? req.files["coverImage"][0].path
      : null;

    await Song.create({
      title,
      artist,
      mainArtist: mainArtist || artist,
      featuredArtists,
      album: album || null,
      genre,
      audioFile,
      coverImage,
      releaseDate
    });

    req.flash("success", "Song uploaded successfully 🎵");
    res.redirect("/admin/songs");

  } catch (err) {
    console.error(err);
    req.flash("error", "Upload failed");
    res.redirect("/admin/songs/create");
  }
};


// =========================
// EDIT SONG PAGE
// =========================
exports.editSongPage = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    const artists = await Artist.find();
    const albums = await Album.find();
    const genres = await Genre.find();

    res.render("admin/songs/edit", {
      song,
      artists,
      albums,
      genres
    });

  } catch (err) {
    console.error(err);
    res.redirect("/admin/songs");
  }
};


// =========================
// UPDATE SONG
// =========================
exports.updateSong = async (req, res) => {
  try {
    let {
      title,
      artist,
      mainArtist,
      featuredArtists,
      album,
      genre,
      releaseDate,
      isFeatured
    } = req.body;

    const song = await Song.findById(req.params.id);

    if (!song) {
      req.flash("error", "Song not found");
      return res.redirect("/admin/songs");
    }

    // =========================
    // ✅ FIX ARTIST (IMPORTANT)
    // =========================
    if (Array.isArray(artist)) {
      artist = artist[0]; // take first if duplicated
    }

    // =========================
    // ✅ FIX FEATURED ARTISTS
    // =========================
    if (!featuredArtists) {
      featuredArtists = [];
    } else if (typeof featuredArtists === "string") {
      // from single input OR comma string
      featuredArtists = featuredArtists.split(",").map(id => id.trim());
    } else if (Array.isArray(featuredArtists)) {
      featuredArtists = featuredArtists;
    }

    // remove empty values
    featuredArtists = featuredArtists.filter(Boolean);

    // =========================
    // UPDATE DATA
    // =========================
    const updateData = {
      title,
      artist,
      mainArtist: mainArtist || artist,
      featuredArtists,
      album: album || null,
      genre,
      releaseDate: releaseDate || null,
      isFeatured: isFeatured ? true : false
    };

    // =========================
    // 🎧 REPLACE AUDIO
    // =========================
    if (req.files && req.files["audioFile"]) {

      const newAudio = req.files["audioFile"][0].path;

      try {
        // delete old audio first
        if (song.audioFile) {
          const publicId = song.audioFile.split("/").pop().split(".")[0];

          await cloudinary.uploader.destroy(
            `ssdbeats/songs/${publicId}`,
            { resource_type: "video" }
          );
        }

        updateData.audioFile = newAudio;

      } catch (cloudErr) {
        console.error("Audio delete failed:", cloudErr);

        req.flash("error", "Failed to replace audio. Try again.");
        return res.redirect(`/admin/songs/edit/${song._id}`);
      }
    }

    // =========================
    // 🖼 REPLACE COVER
    // =========================
    if (req.files && req.files["coverImage"]) {

      const newCover = req.files["coverImage"][0].path;

      try {
        if (song.coverImage) {
          const publicId = song.coverImage.split("/").pop().split(".")[0];

          await cloudinary.uploader.destroy(
            `ssdbeats/song-covers/${publicId}`
          );
        }

        updateData.coverImage = newCover;

      } catch (cloudErr) {
        console.error("Cover delete failed:", cloudErr);

        req.flash("error", "Failed to replace cover. Try again.");
        return res.redirect(`/admin/songs/edit/${song._id}`);
      }
    }

    // =========================
    // SAVE UPDATE
    // =========================
    await Song.findByIdAndUpdate(song._id, updateData);

    req.flash("success", "Song updated successfully ✏️");
    res.redirect("/admin/songs");

  } catch (err) {
    console.error("UPDATE SONG ERROR:", err);
    req.flash("error", "Update failed");
    res.redirect("/admin/songs");
  }
};

// =========================
// DELETE SONG
// =========================
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      req.flash("error", "Song not found");
      return res.redirect("/admin/songs");
    }

    // 🎧 delete audio
    if (song.audioFile) {
      const publicId = song.audioFile.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ssdbeats/songs/${publicId}`, {
        resource_type: "video"
      });
    }

    // 🖼 delete cover
    if (song.coverImage) {
      const publicId = song.coverImage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ssdbeats/song-covers/${publicId}`);
    }

    await Song.findByIdAndDelete(req.params.id);

    req.flash("success", "Song deleted successfully 🗑️");
    res.redirect("/admin/songs");

  } catch (err) {
    console.error(err);
    req.flash("error", "Delete failed");
    res.redirect("/admin/songs");
  }
};