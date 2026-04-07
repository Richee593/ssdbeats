const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Group"],
      default: "Male",
    },

    image: {
      type: String,
    },

    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
      youtube: String,
      tiktok: String,
      audiomack: String,
      spotify: String,
      appleMusic: String,
    },

    // ==========================
    // TRACKING & TRENDING FIELDS
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

    trendingScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for search
artistSchema.index({ name: "text" });

module.exports = mongoose.model("Artist", artistSchema);