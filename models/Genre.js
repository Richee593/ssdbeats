const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  image: {
    type: String,
    default: 'hero.png'
  },

  // ==========================
  // TRENDING / SCORING FIELDS
  // ==========================
  playCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  weeklyScore: {
    type: Number,
    default: 0
  },
  monthlyScore: {
    type: Number,
    default: 0
  },
  yearlyScore: {
    type: Number,
    default: 0
  },
  trendingScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Genre', genreSchema);