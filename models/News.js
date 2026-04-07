const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    unique: true
  },

  content: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: "Music News"
  },

  coverImage: {
    type: String
  },

  author: {
    type: String,
    default: "SSD Beats"
  },

  tags: [String]

}, { timestamps: true });

module.exports = mongoose.model("News", newsSchema);