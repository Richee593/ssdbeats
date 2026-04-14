const express = require("express");
const router = express.Router();

const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Genre = require("../models/Genre"); // if you have a Genre model
const Blog = require("../models/News");   // if you have a Blog/News model
const News = require("../models/News"); // ✅ import your News model
const Fuse = require("fuse.js"); // <- Fuzzy search
const clientController = require("../controllers/clientController");
const newsController = require("../controllers/newsController");
const pageController = require("../controllers/pageController");


// ================= SEARCH ROUTE =================
router.get("/search", async (req, res) => {
  const query = req.query.q?.trim();

  if (!query) return res.redirect("/");

  try {
    // Fetch all songs, artists, albums
    const [allSongs, allArtists, allAlbums] = await Promise.all([
      Song.find().populate("artist album").lean(),
      Artist.find().lean(),
      Album.find().populate("artist").lean(),
    ]);

    // Fuse.js options
    const options = {
      includeScore: true,
      threshold: 0.4, // 0 = exact, 1 = very fuzzy
      keys: ["title", "artist.name", "album.title", "name"],
    };

    // Fuse instances
    const fuseSongs = new Fuse(allSongs, { ...options, keys: ["title", "artist.name", "album.title"] });
    const fuseArtists = new Fuse(allArtists, { ...options, keys: ["name"] });
    const fuseAlbums = new Fuse(allAlbums, { ...options, keys: ["title", "artist.name"] });

    // Search
    const songResults = fuseSongs.search(query).map(r => r.item);
    const artistResults = fuseArtists.search(query).map(r => r.item);
    const albumResults = fuseAlbums.search(query).map(r => r.item);

    res.render("client/search", {
      title: `Search: ${query}`,
      query,
      songs: songResults,
      artists: artistResults,
      albums: albumResults,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});



// ==============================
// SONGS DISCOVERY PAGE
// ==============================
router.get("/songs", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // =========================
    // 🎯 PAGINATED ALL SONGS
    // =========================
    const songs = await Song.find()
      .populate("artist", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalSongs = await Song.countDocuments();
    const totalPages = Math.ceil(totalSongs / limit);


    // =========================
    // 🔥 FETCH ALL FOR LOGIC
    // =========================
    const allSongs = await Song.find()
      .populate("artist album")
      .lean();


    // =========================
    // 🧠 SCORING FUNCTIONS
    // =========================
    const calcTrending = (song) => {
      const play = song.playCount || 0;
      const download = song.downloadCount || 0;
      const share = song.shareCount || 0;

      const base = (play * 1) + (download * 8) + (share * 6);

      let days = 30;
      if (song.releaseDate) {
        const now = new Date();
        const release = new Date(song.releaseDate);
        days = Math.max(1, Math.floor((now - release) / (1000*60*60*24)));
      }

      return base / (days + 2);
    };

    const calcRising = (song) => {
      const play = song.playCount || 0;
      const download = song.downloadCount || 0;
      const share = song.shareCount || 0;

      const base = (play * 1) + (download * 10) + (share * 8);

      let days = 30;
      if (song.releaseDate) {
        const now = new Date();
        const release = new Date(song.releaseDate);
        days = Math.max(1, Math.floor((now - release) / (1000*60*60*24)));
      }

      return base / Math.pow(days, 1.2);
    };


    // =========================
    // 🔥 TRENDING
    // =========================
    const trendingSongs = [...allSongs]
      .map(s => ({ ...s, score: calcTrending(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);


    // =========================
    // 🚀 RISING
    // =========================
    const risingSongs = [...allSongs]
      .map(s => ({ ...s, score: calcRising(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);


    // =========================
    // 🏆 WEEKLY (7 days)
    // =========================
    const weeklySongs = [...allSongs]
      .filter(s => {
        if (!s.releaseDate) return false;
        return (new Date() - new Date(s.releaseDate)) <= 7*24*60*60*1000;
      })
      .map(s => ({ ...s, score: calcTrending(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);


    // =========================
    // 🆕 NEW RELEASES
    // =========================
    const newSongs = [...allSongs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);


    // =========================
    // 📅 YEARLY TOP
    // =========================
    const yearlySongs = [...allSongs]
      .filter(s => {
        if (!s.releaseDate) return false;
        return (new Date() - new Date(s.releaseDate)) <= 365*24*60*60*1000;
      })
      .map(s => ({ ...s, score: calcTrending(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);


    // =========================
    // AJAX PAGINATION
    // =========================
    if (req.xhr) {
      return res.render("client/partials/songCards", { songs });
    }


    // =========================
    // RENDER
    // =========================
    res.render("client/songs", {
      title: "Discover Music - SSD Beats",

      songs, // paginated
      currentPage: page,
      totalPages,

      trendingSongs,
      risingSongs,
      weeklySongs,
      newSongs,
      yearlySongs,

      pageCss: "songs"
    });

  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});


// 2️⃣ Single Song page (DETAIL page)
router.get('/songs/:id', async (req, res) => {
  try {

    const song = await Song.findById(req.params.id)
      .populate('artist')
      .populate('genre');

    if (!song) {
      return res.redirect('/songs');
    }

    const relatedSongs = await Song.find({
      artist: song.artist._id,
      _id: { $ne: song._id }
    })
    .limit(6)
    .populate('artist');

    const baseUrl = req.protocol + '://' + req.get('host');

    const metaDescription =
      `Listen to "${song.title}" by ${song.artist.name} on SSD Beats. Stream and download your favorite tracks.`;

    const canonicalUrl = `${baseUrl}/songs/${song._id}`;

    res.render('client/song', {
      title: song.title,
      song,
      relatedSongs,
      pageCss: 'song',
      baseUrl,
      metaDescription,
      canonicalUrl
    });

  } catch (error) {
    console.error(error);
    res.redirect('/songs');
  }
});


// ==============================
// ARTISTS PAGE (ADVANCED)
// ==============================
router.get('/artists', async (req, res) => {
  try {

    const type = req.query.type || "all"; // all, trending, rising, new
    const page = parseInt(req.query.page) || 1;

    const limit = 18;
    const skip = (page - 1) * limit;

    let query = {};
    let sort = { name: 1 }; // default

    // ======================
    // FILTER LOGIC
    // ======================

    if (type === "trending") {
      sort = { trendingScore: -1 };
    }

    if (type === "new") {
      sort = { createdAt: -1 };
    }

    let artists = await Artist.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // ======================
    // RISING (COMPUTED)
    // ======================
    if (type === "rising") {

      const allArtists = await Artist.find().lean();

      const ranked = allArtists.map(artist => {
        const score =
          (artist.followers || 0) * 5 +
          (artist.totalPlays || 0) * 2;

        let days = 30;
        if (artist.createdAt) {
          const now = new Date();
          const created = new Date(artist.createdAt);
          days = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
        }

        return {
          ...artist,
          risingScore: score / days
        };
      });

      ranked.sort((a, b) => b.risingScore - a.risingScore);

      artists = ranked.slice(skip, skip + limit);
    }

    const totalArtists = await Artist.countDocuments();
    const totalPages = Math.ceil(totalArtists / limit);

    const baseUrl = req.protocol + '://' + req.get('host');

    res.render('client/artists', {
      title: 'Artists - SSD Beats',
      artists,
      currentPage: page,
      totalPages,
      type,
      baseUrl,
      pageCss: 'artists',

      metaDescription: "Discover trending, rising and new artists on SSD Beats.",
      canonicalUrl: `${baseUrl}/artists?type=${type}`
    });

  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});




// 2️⃣ Single artist page (FULL UPGRADE)
router.get('/artists/:id', async (req, res) => {
  try {

    const artist = await Artist.findById(req.params.id).lean();
    if (!artist) return res.redirect('/artists');

    // =========================
    // 🎵 ARTIST SONGS
    // =========================
    const artistSongs = await Song.find({
      $or: [
        { artist: artist._id },
        { mainArtist: artist._id },
        { featuredArtists: { $in: [artist._id] } }  // <--- FIXED
      ]
    })
    .populate("album", "title cover")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
    

    // =========================
    // 💿 ARTIST ALBUMS
    // =========================
    const artistAlbums = await Album.find({ artist: artist._id })
      .sort({ releaseDate: -1 })
      .limit(20)
      .lean();

    // =========================
    // 📊 CALCULATED STATS
    // =========================

    let totalPlays = 0;
    let totalDownloads = 0;

    artistSongs.forEach(song => {
      totalPlays += song.playCount || 0;
      totalDownloads += song.downloadCount || 0;
    });

    const totalSongs = artistSongs.length;
    const totalAlbums = artistAlbums.length;

    // =========================
    // 🔥 TOP SONGS (by popularity)
    // =========================
    const topSongs = [...artistSongs]
      .sort((a, b) => {
        const scoreA = (a.playCount || 0) + (a.downloadCount || 0) * 2;
        const scoreB = (b.playCount || 0) + (b.downloadCount || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 10);

    // =========================
    // 🆕 RECENT SONGS
    // =========================
    const recentSongs = [...artistSongs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // =========================
    // 🌐 META SEO
    // =========================
    const baseUrl = req.protocol + '://' + req.get('host');

    const metaDescription = artist.bio
      ? artist.bio.substring(0, 150)
      : `Explore songs, albums and music by ${artist.name} on SSD Beats.`;

    const canonicalUrl = `${baseUrl}/artists/${artist._id}`;

    // =========================
    // 🚀 RENDER
    // =========================
    res.render('client/artist', {
      title: `${artist.name} - SSD Beats`,
      artist,

      // DATA
      artistSongs,
      artistAlbums,

      // EXTRA SECTIONS
      topSongs,
      recentSongs,

      // STATS
      stats: {
        totalSongs,
        totalAlbums,
        totalPlays,
        totalDownloads
      },

      // META
      baseUrl,
      metaDescription,
      canonicalUrl,

      pageCss: "artist"
    });

  } catch (error) {
    console.error(error);
    res.redirect('/artists');
  }
});





// 1️⃣ All albums with sections: trending, new releases, all
router.get('/albums', async (req, res) => {
  try {
    // Fetch all albums with artist details
    const albums = await Album.find().populate('artist').lean();

    // Prepare sections
    // ----------------
    // Trending albums: sort by total plays + total downloads (descending)
    const trendingAlbums = albums
      .map(album => {
        // Compute stats for each album
        const albumSongs = album.songs || []; // optional: if you embed songs
        let totalPlays = 0;
        let totalDownloads = 0;

        if (albumSongs.length > 0) {
          albumSongs.forEach(song => {
            totalPlays += song.playCount || 0;
            totalDownloads += song.downloadCount || 0;
          });
        }

        return {
          ...album,
          stats: {
            totalPlays,
            totalDownloads,
            popularityScore: totalPlays + totalDownloads * 2
          }
        };
      })
      .sort((a, b) => (b.stats.popularityScore || 0) - (a.stats.popularityScore || 0))
      .slice(0, 10); // top 10 trending

    // New Releases: sorted by releaseDate (latest first)
    const newReleases = [...albums]
      .sort((a, b) => new Date(b.releaseDate || b.createdAt) - new Date(a.releaseDate || a.createdAt))
      .slice(0, 10); // top 10 new releases

    // All albums: sorted by creation date (latest first)
    const allAlbums = [...albums].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // =========================
    // META & SEO
    // =========================
    const baseUrl = req.protocol + '://' + req.get('host');
    const metaDescription = "Browse all albums on SSD Beats. Stream and download the latest albums from top artists.";
    const canonicalUrl = `${baseUrl}/albums`;

    // =========================
    // RENDER
    // =========================
    res.render('client/albums', {
      title: 'All Albums',
      trendingAlbums,
      newReleases,
      allAlbums,
      baseUrl,
      metaDescription,
      canonicalUrl,
      pageCss: 'albums'
    });

  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});



// 2️⃣ Single album page
router.get('/albums/:id', async (req, res) => {
  try {
    // Fetch album with artist details
    const album = await Album.findById(req.params.id).populate('artist').lean();
    if (!album) return res.redirect('/albums');

    // Fetch songs in this album
    const albumSongs = await Song.find({ album: album._id })
      .populate('artist')
      .sort({ createdAt: -1 })
      .lean();

    // =========================
    // CALCULATE STATS
    // =========================
    const totalSongs = albumSongs.length;

    // Initialize counters
    let totalPlays = 0;
    let totalDownloads = 0;

    albumSongs.forEach(song => {
      totalPlays += song.playCount || 0;
      totalDownloads += song.downloadCount || 0;
    });

    // =========================
    // META & SEO
    // =========================
    const baseUrl = req.protocol + '://' + req.get('host');
    const metaDescription = `Listen to "${album.title}" by ${album.artist.name} on SSD Beats. Stream and download all tracks from this album.`;
    const canonicalUrl = `${baseUrl}/albums/${album._id}`;

    // =========================
    // RENDER
    // =========================
    res.render('client/album', {
      title: album.title,
      album,
      albumSongs,
      stats: {
        totalSongs,
        totalPlays,
        totalDownloads
      },
      pageCss: 'album', // <-- tells layout to load album.css
      baseUrl,
      metaDescription,
      canonicalUrl
    });

  } catch (err) {
    console.error(err);
    res.redirect('/albums');
  }
});

// 2️⃣ Single album page
router.get('/albums/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate('artist');
    if (!album) return res.redirect('/albums');

    // Get all songs in this album
    const albumSongs = await Song.find({ album: album._id }).populate('artist').sort({ createdAt: -1 });

    // Calculate stats
    let totalPlays = 0;
    let totalDownloads = 0;
    albumSongs.forEach(song => {
      totalPlays += song.playCount || 0;
      totalDownloads += song.downloadCount || 0;
    });

    const totalSongs = albumSongs.length;

    const baseUrl = req.protocol + '://' + req.get('host');
    const metaDescription = `Listen to "${album.title}" by ${album.artist.name} on SSD Beats. Stream and download all tracks from this album.`;
    const canonicalUrl = `${baseUrl}/albums/${album._id}`;

    res.render('client/album', {
      title: album.title,
      album,
      albumSongs,
      stats: {
        totalSongs,
        totalPlays,
        totalDownloads
      },
      pageCss: 'album',
      baseUrl,
      metaDescription,
      canonicalUrl
    });
  } catch (err) {
    console.error(err);
    res.redirect('/albums');
  }
});


router.get("/", clientController.homePage);
router.get("/genre/:id", clientController.genrePage);


// Single news article
router.get("/news/:slug", clientController.singleNews);
// News page
router.get("/news", clientController.newsPage);

router.get("/tag/:tag", clientController.tagPage);



router.get("/genres", clientController.genresPage);


// MUST BE LAST
router.get("/:slug", pageController.viewPage);



module.exports = router;