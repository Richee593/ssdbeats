const Genre = require("../models/Genre");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const News = require("../models/News");

// =====================
// Home Page
// =====================
exports.homePage = async (req, res) => {
  try {

    // Latest Songs (new uploads)
    const latestSongs = await Song.find()
      .populate("artist")
      .populate("album")
      .sort({ createdAt: -1 })
      .limit(15);


    // 🔥 Trending Songs (overall trending)
    // 🔥 Trending Songs (last 90 days only)
    const trendingSongs = await Song.find({
      releaseDate: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) }
    })
    .populate("artist")
    .populate("album")
    .sort({ trendingScore: -1 })
    .limit(15);
    


    // 🚀 Rising Songs (fast growing songs this week)
    const risingSongs = await Song.find()
      .populate("artist")
      .populate("album")
      .sort({ weeklyScore: -1, trendingScore: -1 })
      .limit(12);


    // 🏆 Weekly Chart
    const weeklySongs = await Song.find()
      .populate("artist")
      .populate("album")
      .sort({ weeklyScore: -1 })
      .limit(12);


    // ⭐ Trending Artists
    const trendingArtists = await Artist.find()
      .sort({ trendingScore: -1 })
      .limit(12);


    // 💿 Trending Albums
    const trendingAlbums = await Album.find()
      .sort({ trendingScore: -1 })
      .limit(9);



    
    // Fetch Genres with Most Songs and Plays
    const genres = await Genre.aggregate([
      {
        $lookup: {
          from: "songs",          // Reference to the Song collection
          localField: "_id",      // The genre's _id field
          foreignField: "genre",  // The genre field in the Song collection
          as: "songs"            // Store the resulting songs in a new "songs" array
        }
      },
      {
        $addFields: {
          totalSongs: { $size: "$songs" },  // Count how many songs belong to this genre
          totalPlays: { 
            $sum: "$songs.plays"  // Sum up the "plays" field of all the songs in this genre
          }
        }
      },
      {
        $sort: {
          totalSongs: -1,    // Sort by the number of songs in descending order
          totalPlays: -1     // Sort by the number of plays in descending order if tied
        }
      },
      {
        $limit: 1  // Get the genre with the most songs (and most plays)
      }
    ]);

    // Fetch the top genre data
    const topGenre = genres.length > 0 ? genres[0] : null;


    // 📰 Music News
    const latestNews = await News.find()
      .sort({ createdAt: -1 })
      .limit(4);


    const baseUrl = req.protocol + "://" + req.get("host");


    res.render("client/index", {

      trendingSongs,
      risingSongs,
      weeklySongs,
      latestSongs,

      trendingArtists,
      trendingAlbums,

      topGenre,  // Add topGenre to the template to display
      latestNews,

      pageCss: "home",

      title: "SSD Beats - Discover Trending South Sudan Music",
      metaDescription:
        "Discover trending songs, rising artists, albums and music news on SSD Beats — the home of South Sudan music.",

      metaKeywords:
        "SSD Beats, South Sudan music, trending songs, new music, artists, albums",

      canonicalUrl: req.originalUrl.startsWith("http")
        ? req.originalUrl
        : baseUrl + req.originalUrl,

      baseUrl
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};



// =====================
// ALL GENRES PAGE
// =====================
exports.genresPage = async (req, res) => {
  try {

    const genres = await Genre.find().sort({ name: 1 }).lean();

    // Optional: count songs per genre (🔥 good UX)
    const genresWithCount = await Promise.all(
      genres.map(async (genre) => {
        const count = await Song.countDocuments({ genre: genre._id });
        return { ...genre, count };
      })
    );

    const baseUrl = req.protocol + "://" + req.get("host");

    res.render("client/genres", {
      title: "Browse Genres - SSD Beats",
      genres: genresWithCount,
      baseUrl,
      pageCss: "genres"
    });

  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};



// =====================
// GENRE DISCOVERY PAGE
// =====================
exports.genrePage = async (req, res) => {
  try {

    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.redirect("/genres");

    // =========================
    // 🎯 PAGINATION (ALL SONGS)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const songs = await Song.find({ genre: genre._id })
      .populate("artist album")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalSongs = await Song.countDocuments({ genre: genre._id });
    const totalPages = Math.ceil(totalSongs / limit);


    // =========================
    // 🔥 FETCH ALL FOR LOGIC
    // =========================
    const allSongs = await Song.find({ genre: genre._id })
      .populate("artist album")
      .lean();


    // =========================
    // 🧠 SCORING
    // =========================
    const calcTrending = (song) => {
      const base =
        (song.playCount || 0) +
        (song.downloadCount || 0) * 8 +
        (song.shareCount || 0) * 6;

      let days = 30;
      if (song.releaseDate) {
        const now = new Date();
        const release = new Date(song.releaseDate);
        days = Math.max(1, Math.floor((now - release) / (1000*60*60*24)));
      }

      return base / (days + 2);
    };


    // =========================
    // 🔥 TRENDING
    // =========================
    const trendingSongs = [...allSongs]
      .map(s => ({ ...s, score: calcTrending(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);


    // =========================
    // 🚀 RISING
    // =========================
    const risingSongs = [...allSongs]
      .map(s => {
        const score =
          ((s.playCount || 0) +
          (s.downloadCount || 0) * 10 +
          (s.shareCount || 0) * 8) / 7;

        return { ...s, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);


    // =========================
    // 🆕 NEW
    // =========================
    const newSongs = [...allSongs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);


    const baseUrl = req.protocol + "://" + req.get("host");

    res.render("client/genre", {
      genre,

      songs,
      currentPage: page,
      totalPages,

      trendingSongs,
      risingSongs,
      newSongs,

      baseUrl,
      pageCss: "songs",
      title: `${genre.name} Music - SSD Beats`
    });

  } catch (err) {
    console.error(err);
    res.redirect("/genres");
  }
};




// =====================
// All News Page
// =====================
exports.newsPage = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    const baseUrl = req.protocol + "://" + req.get("host");

    res.render("client/news/index", {
      title: "Music News - SSD Beats",
      news,
      metaDescription: "Stay updated with the latest music news on SSD Beats.",
      metaKeywords: "music news, SSD Beats, songs, albums, artists",
      canonicalUrl: baseUrl + req.originalUrl,
      baseUrl
    });

  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// =====================
// Single News Page
// =====================
exports.singleNews = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug });
    if (!news) return res.redirect("/news");

    const latest = await News.find().sort({ createdAt: -1 }).limit(6);

    const metaDescription = news.content
      .replace(/(<([^>]+)>)/gi, "")
      .substring(0, 160);

    const metaKeywords = news.tags && news.tags.length
      ? news.tags.join(", ") + ", SSD Beats, music news"
      : "SSD Beats, music news";

    const baseUrl = req.protocol + "://" + req.get("host");

    res.render("client/news/single", {
      title: `${news.title} - SSD Beats`,
      news,
      latest,
      metaDescription,
      metaKeywords,
      pageCss: 'news', // <-- tells layout to load news.css
      canonicalUrl: baseUrl + req.originalUrl,
      baseUrl
    });

  } catch (err) {
    console.error(err);
    res.redirect("/news");
  }
};

// =====================
// Tag Page (News by Tag)
// =====================
exports.tagPage = async (req, res) => {
  try {
    const tag = req.params.tag;

    const taggedNews = await News.find({ tags: tag }).sort({ createdAt: -1 });
    const latestNews = await News.find().sort({ createdAt: -1 }).limit(5);

    const baseUrl = req.protocol + "://" + req.get("host");

    res.render("client/news/tag", {
      title: `Tag: ${tag} - SSD Beats`,
      tag,
      taggedNews,
      latestNews,
      metaDescription: `SSD Beats news articles tagged with ${tag}. Stay updated with the latest music news.`,
      metaKeywords: `music, news, ${tag}, SSD Beats`,
      canonicalUrl: baseUrl + req.originalUrl,
      baseUrl
    });

  } catch (err) {
    console.error(err);
    res.redirect("/news");
  }
};