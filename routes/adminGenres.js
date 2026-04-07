const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');
const Song = require("../models/Song");
const slugify = require('slugify');


// 📌 LIST ALL GENRES
router.get('/', async (req, res) => {
  const genres = await Genre.find().sort({ createdAt: -1 });

  // attach song count
  const genresWithCount = await Promise.all(
    genres.map(async (g) => {
      const count = await Song.countDocuments({ genre: g._id });
      return {
        ...g.toObject(),
        songCount: count
      };
    })
  );

  res.render('admin/genres/index', { genres: genresWithCount });
});


// 📌 CREATE PAGE
router.get('/create', (req, res) => {
  res.render('admin/genres/create');
});


// 📌 STORE GENRE
router.post('/create', async (req, res) => {
  const { name } = req.body;

  await Genre.create({
    name,
    slug: slugify(name, { lower: true })
  });

  res.redirect('/admin/genres');
});


// 📌 EDIT PAGE
router.get('/edit/:id', async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  res.render('admin/genres/edit', { genre });
});


// 📌 UPDATE GENRE
router.post('/edit/:id', async (req, res) => {
  const { name } = req.body;

  await Genre.findByIdAndUpdate(req.params.id, {
    name,
    slug: slugify(name, { lower: true })
  });

  res.redirect('/admin/genres');
});


// 📌 DELETE
router.post('/delete/:id', async (req, res) => {
  try {
    const genreId = req.params.id;

    const genre = await Genre.findById(genreId);

    if (!genre) {
      req.flash("error", "Genre not found");
      return res.redirect("/admin/genres");
    }

    // 🔥 CHECK IF USED IN SONGS
    const songsCount = await Song.countDocuments({ genre: genreId });

    if (songsCount > 0) {
      req.flash("error", `Cannot delete. Genre used in ${songsCount} song(s).`);
      return res.redirect("/admin/genres");
    }

    // ✅ DELETE GENRE
    await Genre.findByIdAndDelete(genreId);

    req.flash("success", "Genre deleted successfully");

    res.redirect("/admin/genres");

  } catch (err) {
    console.error(err);
    req.flash("error", "Delete failed");
    res.redirect("/admin/genres");
  }
});

module.exports = router;