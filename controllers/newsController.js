const News = require("../models/News");
const cloudinary = require("../config/cloudinary");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");


// =========================
// GET ALL NEWS (ADMIN)
// =========================
exports.getNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });

    res.render("admin/news/index", {
      title: "News",
      news,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load news");
    res.redirect("/admin/dashboard");
  }
};


// =========================
// CREATE PAGE
// =========================
exports.createNewsPage = (req, res) => {
  res.render("admin/news/create", {
    title: "Create News",
    success: req.flash("success"),
    error: req.flash("error")
  });
};


// =========================
// CREATE NEWS
// =========================
exports.createNews = async (req, res) => {
  try {
    const { title, content, category, author, tags } = req.body;

    let slug = slugify(title, { lower: true, strict: true });
    const existing = await News.findOne({ slug });

    if (existing) {
      slug += "-" + Date.now();
    }

    // ☁️ Cloudinary
    const coverImage = req.file ? req.file.path : null;

    await News.create({
      title,
      slug,
      content,
      category,
      author,
      coverImage,
      tags: tags
        ? tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : []
    });

    req.flash("success", "News created successfully");
    res.redirect("/admin/news");

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to create news");
    res.redirect("/admin/news/create");
  }
};

// =========================
// EDIT PAGE
// =========================
exports.editNewsPage = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      req.flash("error", "News not found");
      return res.redirect("/admin/news");
    }

    res.render("admin/news/edit", {
      title: "Edit News",
      news,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load news");
    res.redirect("/admin/news");
  }
};


// =========================
// UPDATE NEWS
// =========================
exports.updateNews = async (req, res) => {
  try {
    const { title, content, category, author, tags } = req.body;

    let slug = slugify(title, { lower: true, strict: true });

    const existing = await News.findOne({
      slug,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      slug += "-" + Date.now();
    }

    const news = await News.findById(req.params.id);

    if (!news) {
      req.flash("error", "News not found");
      return res.redirect("/admin/news");
    }

    const updateData = {
      title,
      slug,
      content,
      category,
      author,
      tags: tags
        ? tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : []
    };

    // ☁️ Replace image SAFELY
    if (req.file) {

      if (news.coverImage) {
        const publicId = news.coverImage.split("/").pop().split(".")[0];

        await cloudinary.uploader.destroy(`ssdbeats/news/${publicId}`);
      }

      updateData.coverImage = req.file.path;
    }

    await News.findByIdAndUpdate(req.params.id, updateData);

    req.flash("success", "News updated successfully");
    res.redirect("/admin/news");

  } catch (err) {
    console.error(err);
    req.flash("error", "Update failed");
    res.redirect(`/admin/news/edit/${req.params.id}`);
  }
};


// =========================
// DELETE NEWS
// =========================
// DELETE NEWS (ADMIN)
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      req.flash("error", "News not found");
      return res.redirect("/admin/news");
    }

    // 🔒 Delete cover image from Cloudinary if it exists
    if (news.coverImage) {
      const getPublicId = (url) => {
        if (!url.includes("/upload/")) return null;
        return url.split("/upload/")[1].split(".")[0];
      };

      const publicId = getPublicId(news.coverImage);

      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log("Cloudinary delete result:", result);

          if (result.result !== "ok" && result.result !== "not found") {
            req.flash("error", "Cloudinary delete failed ❌");
            return res.redirect("/admin/news");
          }
        } catch (err) {
          console.error("Cloudinary deletion error:", err.message);
          req.flash("error", "Failed to delete image from Cloudinary");
          return res.redirect("/admin/news");
        }
      }
    }

    // ✅ Delete news from DB
    await News.findByIdAndDelete(req.params.id);

    req.flash("success", "News deleted successfully ✅");
    res.redirect("/admin/news");

  } catch (err) {
    console.error("DELETE NEWS ERROR:", err);
    req.flash("error", "Delete failed ❌");
    res.redirect("/admin/news");
  }
};


// =========================
// PUBLIC NEWS LIST
// =========================
exports.publicNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });

    res.render("client/news/index", {
      title: "Music News",
      news
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// =========================
// SINGLE NEWS PAGE
// =========================
exports.singleNews = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug });

    if (!news) {
      return res.status(404).render("client/404", {
        title: "Not Found"
      });
    }

    const latest = await News.find({
      _id: { $ne: news._id }
    })
      .sort({ createdAt: -1 })
      .limit(4);

    res.render("client/news/single", {
      title: news.title,
      news,
      latest
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};