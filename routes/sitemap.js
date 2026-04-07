const express = require("express");
const router = express.Router();
const { SitemapStream, streamToPromise } = require("sitemap");
const News = require("../models/News");

router.get("/sitemap.xml", async (req, res) => {

  try {

    const sitemap = new SitemapStream({ hostname: "http://localhost:5000" });

    // Static pages
    sitemap.write({ url: "/", changefreq: "daily", priority: 1.0 });
    sitemap.write({ url: "/news", changefreq: "daily", priority: 0.9 });

    // Fetch news
    const news = await News.find().sort({ createdAt: -1 });

    news.forEach(article => {
      sitemap.write({
        url: `/news/${article.slug}`,
        changefreq: "weekly",
        priority: 0.8
      });
    });

    sitemap.end();

    const xml = await streamToPromise(sitemap);

    res.header("Content-Type", "application/xml");
    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).end();
  }

});

module.exports = router;