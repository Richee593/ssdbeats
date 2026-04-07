const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true },

  genre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Genre",
    required: true,
  },

  releaseDate: { type: Date },
  cover: { type: String }, // store image filename

  // ==========================
  // TRACKING & TRENDING FIELDS
  // ==========================
  playCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },

  trendingScore: { type: Number, default: 0 },
  weeklyScore: { type: Number, default: 0 },
  monthlyScore: { type: Number, default: 0 },
  yearlyScore: { type: Number, default: 0 },

}, { timestamps: true });

// Text index for search
albumSchema.index({ title: "text", artist: "text" });

module.exports = mongoose.model("Album", albumSchema);