const Artist = require("../models/Artist");
const Song = require("../models/Song");
const cloudinary = require("../config/cloudinary");


// =========================
// GET ALL ARTISTS
// =========================
exports.getArtists = async (req, res) => {
  const artists = await Artist.find().sort({ createdAt: -1 });

  res.render("admin/artists/index", {
    title: "Artists",
    artists,
  });
};


// =========================
// CREATE PAGE
// =========================
exports.createArtistPage = async (req, res) => {
  const artists = await Artist.find().select("name");

  res.render("admin/artists/create", {
    title: "Create Artist",
    artists // ✅ FIXED
  });
};


// =========================
// CREATE ARTIST
// =========================
exports.createArtist = async (req, res) => {
  try {
    const {
      name,
      bio,
      gender,
      instagram,
      facebook,
      twitter,
      youtube,
      tiktok,
      audiomack,
      spotify,
      appleMusic
    } = req.body;

    // 🔥 Check duplicate
    const existing = await Artist.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existing) {
      req.flash("error", "Artist already exists ⚠");
      return res.redirect("/admin/artists/create");
    }

    // ☁️ Cloudinary image
    const image = req.file ? req.file.path : null;

    await Artist.create({
      name,
      bio,
      gender,
      image,
      socialLinks: {
        instagram,
        facebook,
        twitter,
        youtube,
        tiktok,
        audiomack,
        spotify,
        appleMusic
      }
    });

    req.flash("success", "Artist created successfully ✅");
    res.redirect("/admin/artists");

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to create artist");
    res.redirect("/admin/artists/create");
  }
};


// =========================
// UPDATE ARTIST
// =========================
exports.updateArtist = async (req, res) => {
  try {
    const {
      name,
      bio,
      gender,
      instagram,
      facebook,
      twitter,
      youtube,
      tiktok,
      audiomack,
      spotify,
      appleMusic
    } = req.body;

    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      req.flash("error", "Artist not found");
      return res.redirect("/admin/artists");
    }

    // 🔥 Check duplicate (exclude self)
    const existing = await Artist.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id }
    });

    if (existing) {
      req.flash("error", "Another artist with this name exists ⚠");
      return res.redirect(`/admin/artists/edit/${req.params.id}`);
    }

    const updateData = {
      name,
      bio,
      gender,
      socialLinks: {
        instagram,
        facebook,
        twitter,
        youtube,
        tiktok,
        audiomack,
        spotify,
        appleMusic
      }
    };

    // ☁️ If new image uploaded
    if (req.file) {

      // 🔥 delete old image from Cloudinary
      if (artist.image) {
        const publicId = artist.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`ssdbeats/artists/${publicId}`);
      }

      updateData.image = req.file.path;
    }

    await Artist.findByIdAndUpdate(req.params.id, updateData);

    req.flash("success", "Artist updated successfully ✏️");
    res.redirect("/admin/artists");

  } catch (err) {
    console.error(err);
    req.flash("error", "Update failed");
    res.redirect("/admin/artists");
  }
};


// =========================
// EDIT PAGE
// =========================
exports.editArtistPage = async (req, res) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    req.flash("error", "Artist not found");
    return res.redirect("/admin/artists");
  }

  const artists = await Artist.find().select("name");

  res.render("admin/artists/edit", {
    title: `Edit ${artist.name}`,
    artist,
    artists // ✅ FIXED
  });
};

// =========================
// DELETE ARTIST
// =========================
const getPublicId = (url) => {
  try {
    const parts = url.split("/upload/")[1]; 
    const noExtension = parts.split(".")[0];

    // 🔥 REMOVE version (v123456/)
    const publicId = noExtension.replace(/^v\d+\//, "");

    return publicId;
  } catch {
    return null;
  }
};

exports.deleteArtist = async (req, res) => {
  try {
    const artistId = req.params.id;

    const artist = await Artist.findById(artistId);

    if (!artist) {
      req.flash("error", "Artist not found");
      return res.redirect("/admin/artists");
    }

    // 🚫 Prevent delete if used in songs
    const songsCount = await Song.countDocuments({
      $or: [
        { artist: artistId },
        { featuredArtists: artistId }
      ]
    });

    if (songsCount > 0) {
      req.flash("error", `Cannot delete. Used in ${songsCount} song(s).`);
      return res.redirect("/admin/artists");
    }

    // =========================
    // ☁️ DELETE FROM CLOUDINARY FIRST (STRICT)
    // =========================
    if (artist.image) {
      const publicId = getPublicId(artist.image);
    
      console.log("Deleting Cloudinary image:", publicId);
    
      const result = await cloudinary.uploader.destroy(publicId);
    
      console.log("Cloudinary result:", result);
    
      if (result.result !== "ok" && result.result !== "not found") {
        req.flash("error", "Failed to delete image from cloud. Try again.");
        return res.redirect("/admin/artists");
      }
    }
        

    // =========================
    // 🗑️ DELETE FROM DATABASE
    // =========================
    await Artist.findByIdAndDelete(artistId);

    req.flash("success", "Artist deleted successfully 🗑️");
    res.redirect("/admin/artists");

  } catch (err) {
    console.error("DELETE ARTIST ERROR:", err);

    req.flash("error", "Delete failed. Please try again.");
    res.redirect("/admin/artists");
  }
};