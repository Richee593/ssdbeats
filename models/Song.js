const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔥 OLD (keep for now to avoid breaking things)
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    // 🔥 NEW (MAIN + FEATURED SYSTEM)
    mainArtist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
    },

    featuredArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],

    // 🔥 FUTURE (optional upgrade later)
    // artists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],

    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: false,
    },

    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },

    releaseDate: {
      type: Date,
    },

    duration: {
      type: String,
    },

    audioFile: {
      type: String,
      required: true,
    },

    coverImage: {
      type: String,
      default: null,
    },

    // ==========================
    // INTERACTION COUNTS
    // ==========================

    playCount: {
      type: Number,
      default: 0,
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // SCORE SYSTEM
    // ==========================

    trendingScore: {
      type: Number,
      default: 0,
    },

    weeklyScore: {
      type: Number,
      default: 0,
    },

    monthlyScore: {
      type: Number,
      default: 0,
    },

    yearlyScore: {
      type: Number,
      default: 0,
    },

    // ==========================
    // FEATURE FLAGS
    // ==========================

    isFeatured: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// Search index
songSchema.index({
  title: "text"
});

module.exports = mongoose.model("Song", songSchema);