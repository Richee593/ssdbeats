const express = require("express");
const router = express.Router();
const Song = require("../../models/Song");

/* ===============================
   TRENDING SONGS (All-time trending)
================================ */
router.get("/trending", async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ trendingScore: -1 })
      .limit(10)
      .populate("artist genre album");

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   WEEKLY CHART
================================ */
router.get("/weekly", async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ weeklyScore: -1 })
      .limit(10)
      .populate("artist genre album");

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   MONTHLY CHART
================================ */
router.get("/monthly", async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ monthlyScore: -1 })
      .limit(10)
      .populate("artist genre album");

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   YEARLY CHART
================================ */
router.get("/yearly", async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ yearlyScore: -1 })
      .limit(10)
      .populate("artist genre album");

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   RISING SONGS (new + trending in short period)
================================ */
router.get("/rising", async (req, res) => {
  try {
    const songs = await Song.find().populate("artist genre album");

    const ranked = songs.map(song => {
      const baseScore =
        (song.playCount || 0) * 1 +
        (song.downloadCount || 0) * 6 +
        (song.shareCount || 0) * 4;

      let days = 30;
      if (song.releaseDate) {
        const now = new Date();
        const release = new Date(song.releaseDate);
        days = Math.max(
          1,
          Math.floor((now - release) / (1000 * 60 * 60 * 24))
        );
      }

      const risingScore = baseScore / days;

      return { song, risingScore };
    });

    ranked.sort((a, b) => b.risingScore - a.risingScore);

    res.json(ranked.slice(0, 10).map(r => r.song));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;