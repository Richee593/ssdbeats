const express = require("express");
const router = express.Router();
const path = require("path");

const Song = require("../../models/Song");
const Album = require("../../models/Album");
const Artist = require("../../models/Artist");
const Genre = require("../../models/Genre");

// ==========================
// Helper to calculate trending scores
// ==========================
function calculateScores(entity) {
  // Trending formula (professional)
  // You can tweak weights
  entity.trendingScore =
    (entity.playCount || 0) * 1 +
    (entity.downloadCount || 0) * 5 +
    (entity.shareCount || 0) * 4;

  // Weekly: last 7 days weighted
  entity.weeklyScore =
    ((entity.playCount || 0) * 1) +
    ((entity.downloadCount || 0) * 5) +
    ((entity.shareCount || 0) * 4);

  // Monthly: last 30 days
  entity.monthlyScore =
    ((entity.playCount || 0) * 1) +
    ((entity.downloadCount || 0) * 5) +
    ((entity.shareCount || 0) * 4);

  // Yearly: last 365 days
  entity.yearlyScore =
    ((entity.playCount || 0) * 1) +
    ((entity.downloadCount || 0) * 5) +
    ((entity.shareCount || 0) * 4);

  return entity;
}

// ==========================
// TRACK PLAY
// ==========================
router.post("/play/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate("artist")
      .populate("album")
      .populate("genre");

    if (!song) return res.status(404).json({ message: "Song not found" });

    // Increment play
    song.playCount = (song.playCount || 0) + 1;

    // Recalculate song scores
    calculateScores(song);
    await song.save();

    // -------------------------
    // Update album scores
    // -------------------------
    if (song.album) {
      const album = await Album.findById(song.album._id);
      if (album) {
        const songsInAlbum = await Song.find({ album: album._id });

        album.playCount = songsInAlbum.reduce((acc, s) => acc + (s.playCount || 0), 0);
        album.downloadCount = songsInAlbum.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
        album.shareCount = songsInAlbum.reduce((acc, s) => acc + (s.shareCount || 0), 0);

        calculateScores(album);
        await album.save();
      }
    }

    // -------------------------
    // Update artist scores
    // -------------------------
    if (song.artist) {
      const artist = await Artist.findById(song.artist._id);
      if (artist) {
        const artistSongs = await Song.find({ artist: artist._id });

        artist.playCount = artistSongs.reduce((acc, s) => acc + (s.playCount || 0), 0);
        artist.downloadCount = artistSongs.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
        artist.shareCount = artistSongs.reduce((acc, s) => acc + (s.shareCount || 0), 0);

        calculateScores(artist);
        await artist.save();
      }
    }

    // -------------------------
    // Update genre scores
    // -------------------------
    if (song.genre) {
      const genre = await Genre.findById(song.genre._id);
      if (genre) {
        const genreSongs = await Song.find({ genre: genre._id });

        genre.playCount = genreSongs.reduce((acc, s) => acc + (s.playCount || 0), 0);
        genre.downloadCount = genreSongs.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
        genre.shareCount = genreSongs.reduce((acc, s) => acc + (s.shareCount || 0), 0);

        calculateScores(genre);
        await genre.save();
      }
    }

    res.json({
      success: true,
      playCount: song.playCount,
      trendingScore: song.trendingScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// DOWNLOAD TRACK (SSDbeats logo overlay)
// ==========================
router.get("/download/:id", async (req, res) => {
  try {
    // Fetch the song
    const song = await Song.findById(req.params.id)
      .populate("artist")
      .populate("album")
      .populate("genre");

    if (!song || !song.audioFile) {
      return res.status(404).send("File not found");
    }

    // --------- Increment download count ----------
    song.downloadCount = (song.downloadCount || 0) + 1;
    calculateScores(song);
    await song.save();

    // --------- Update album/artist/genre counts ----------
    const updateEntities = async (entityRef, model) => {
      if (!entityRef) return;

      const entity = await model.findById(entityRef._id);
      if (!entity) return;

      const songs = await Song.find({
        [model.collection.name.slice(0, -1)]: entity._id,
      });

      entity.playCount = songs.reduce((acc, s) => acc + (s.playCount || 0), 0);
      entity.downloadCount = songs.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
      entity.shareCount = songs.reduce((acc, s) => acc + (s.shareCount || 0), 0);

      calculateScores(entity);
      await entity.save();
    };

    await updateEntities(song.album, Album);
    await updateEntities(song.artist, Artist);
    await updateEntities(song.genre, Genre);
    
    
    // --------- Prepare safe filename ----------
    const safeTitle = song.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");

    // --------- Download from Cloudinary and embed SSDbeats logo ----------
    const axios = require("axios");
    const NodeID3 = require("node-id3");
    const fs = require("fs");

    // detect extension (.mp3 / .m4a)
    const ext = song.audioFile.split(".").pop().split("?")[0];

    const tempFile = path.join(__dirname, `../../temp-${Date.now()}.${ext}`);
    const logoPath = path.join(__dirname, "../../public/images/hero.png");

    // download audio file
    const response = await axios({
      url: song.audioFile,
      method: "GET",
      responseType: "arraybuffer",
    });

    // save temporary file
    fs.writeFileSync(tempFile, response.data);

    // embed SSDbeats logo artwork
    const tags = {
      title: song.title,
      artist: song.artist?.name || "SSDbeats",
      album: song.album?.title || "SSDbeats",
      APIC: logoPath,
    };

    try {
      NodeID3.write(tags, tempFile);
    } catch (e) {
      console.log("Artwork embed failed, continuing download...");
    }

    // send to user
    res.download(tempFile, `${safeTitle}.${ext}`, () => {
      try {
        fs.unlinkSync(tempFile); // delete temp file
      } catch (e) {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Download error");
  }
});


// ==========================
// SHARE TRACK
// ==========================
router.post("/share/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate("artist")
      .populate("album")
      .populate("genre");

    if (!song) return res.status(404).json({ message: "Song not found" });

    song.shareCount = (song.shareCount || 0) + 1;
    calculateScores(song);
    await song.save();

    // Update album, artist, genre same as play
    const updateEntities = async (entityRef, model) => {
      if (entityRef) {
        const entity = await model.findById(entityRef._id);
        if (entity) {
          const songs = await Song.find({ [model.collection.name.slice(0, -1)]: entity._id });
          entity.playCount = songs.reduce((acc, s) => acc + (s.playCount || 0), 0);
          entity.downloadCount = songs.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
          entity.shareCount = songs.reduce((acc, s) => acc + (s.shareCount || 0), 0);
          calculateScores(entity);
          await entity.save();
        }
      }
    };

    await updateEntities(song.album, Album);
    await updateEntities(song.artist, Artist);
    await updateEntities(song.genre, Genre);

    res.json({ message: "Song shared", shareCount: song.shareCount, trendingScore: song.trendingScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sharing song" });
  }
});

module.exports = router;