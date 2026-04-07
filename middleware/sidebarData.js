// middleware/sidebarData.js
const Genre = require("../models/Genre");
const Artist = require("../models/Artist");
const Album = require("../models/Album");

module.exports = async (req, res, next) => {
  try {
    res.locals.genres = await Genre.find().limit(20);
    res.locals.trendingArtists = await Artist.find().sort({ followers: -1 }).limit(5);
    res.locals.featuredAlbums = await Album.find().sort({ createdAt: -1 }).limit(5);

    next();
  } catch (err) {
    console.log("Sidebar middleware error:", err);
    next();
  }
};