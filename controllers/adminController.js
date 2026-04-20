
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Admin = require("../models/Admin");

const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Genre = require("../models/Genre");
const News = require("../models/News");

// =========================
// LOGIN PAGE
// =========================
exports.loginPage = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/login", {
    title: "Admin Login"
  });
};

// =========================
// LOGIN VALIDATION
// =========================
exports.loginValidation = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").isLength({ min: 5 }).withMessage("Password must be at least 5 characters"),
];

// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      return res.redirect("/admin/login");
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email: email.toLowerCase()
    });
    
    

    // ❌ user not found
    if (!admin) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/admin/login");
    }

    // 🔒 check if account is locked
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      req.flash("error", "Account locked. Try again later.");
      return res.redirect("/admin/login");
    }

    // 🔑 check password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {

      admin.loginAttempts += 1;

      // lock after 5 failed attempts
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min
        admin.loginAttempts = 0;
      }

      await admin.save();

      req.flash("error", "Invalid email or password");
      return res.redirect("/admin/login");
    }

    // ✅ reset login attempts on success
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    // 🔐 REGENERATE SESSION (VERY IMPORTANT)
    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        req.flash("error", "Login error");
        return res.redirect("/admin/login");
      }

      // 🧠 secure session
      req.session.admin = {
        id: admin._id,
        email: admin.email,
        role: admin.role || "admin",
        loginTime: Date.now() // required for timeout
      };

      req.flash("success", "Welcome back 👋");
      res.redirect("/admin/dashboard");
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Login failed");
    res.redirect("/admin/login");
  }
};

// =========================
// DASHBOARD
// =========================
exports.dashboard = async (req, res) => {
  try {

    // =========================
    // PLATFORM STATS
    // =========================

    const totalSongs = await Song.countDocuments();
    const totalArtists = await Artist.countDocuments();
    const totalAlbums = await Album.countDocuments();
    const totalGenres = await Genre.countDocuments();
    const totalNews = await News.countDocuments();

    const totalPlays = await Song.aggregate([
      { $group: { _id: null, plays: { $sum: "$playCount" } } }
    ]);

    const totalDownloads = await Song.aggregate([
      { $group: { _id: null, downloads: { $sum: "$downloadCount" } } }
    ]);

    const totalShares = await Song.aggregate([
      { $group: { _id: null, shares: { $sum: "$shareCount" } } }
    ]);

    const totalLikes = await Song.aggregate([
      { $group: { _id: null, likes: { $sum: "$likeCount" } } }
    ]);
    
    
    
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    
    const weeklyStats = await Song.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          plays: { $sum: "$playCount" },
          downloads: { $sum: "$downloadCount" },
          shares: { $sum: "$shareCount" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);
            
    
    
    // =========================
    // TOP PERFORMING SONGS
    // =========================
    
    // Most Played
    const mostPlayedSongs = await Song.find()
      .populate("artist")
      .sort({ playCount: -1 })
      .limit(5);
    
    // Most Downloaded
    const mostDownloadedSongs = await Song.find()
      .populate("artist")
      .sort({ downloadCount: -1 })
      .limit(5);
    
    // Most Shared
    const mostSharedSongs = await Song.find()
      .populate("artist")
      .sort({ shareCount: -1 })
      .limit(5);
    
    // Most Liked
    const mostLikedSongs = await Song.find()
      .populate("artist")
      .sort({ likeCount: -1 })
      .limit(5);
    // =========================
    // TRENDING SONGS
    // =========================

    const trendingSongs = await Song.find()
      .populate("artist")
      .sort({ trendingScore: -1 })
      .limit(5);

    // =========================
    // RISING SONGS
    // =========================

    const risingSongs = await Song.find()
      .populate("artist")
      .sort({ weeklyScore: -1 })
      .limit(5);

    // =========================
    // LATEST UPLOADS
    // =========================

    const latestSongs = await Song.find()
      .populate("artist")
      .sort({ createdAt: -1 })
      .limit(5);

    // =========================
    // GENRE DISTRIBUTION
    // =========================

    const genreStats = await Song.aggregate([
      {
        $lookup: {
          from: "genres",
          localField: "genre",
          foreignField: "_id",
          as: "genre"
        }
      },
      { $unwind: "$genre" },
      {
        $group: {
          _id: "$genre.name",
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",

      stats: {
        totalSongs,
        totalArtists,
        totalAlbums,
        totalGenres,
        totalNews,
        totalPlays: totalPlays[0]?.plays || 0,
        totalDownloads: totalDownloads[0]?.downloads || 0,
        totalShares: totalShares[0]?.shares || 0,
        totalLikes: totalLikes[0]?.likes || 0
      },
      
      weeklyStats,
      trendingSongs,
      risingSongs,
      latestSongs,
      genreStats,
      
      mostPlayedSongs,
      mostDownloadedSongs,
      mostSharedSongs,
      mostLikedSongs
      
    });

  } catch (err) {
    console.error(err);
    res.send("Dashboard error");
  }
};


// =========================
// LOGOUT
// =========================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};