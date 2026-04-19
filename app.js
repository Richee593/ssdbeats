require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

const expressLayouts = require("express-ejs-layouts");

const connectDB = require("./config/db");

const sidebarData = require("./middleware/sidebarData");

const Page = require("./models/Page");

const clientRoutes = require("./routes/client");
const adminRoutes = require("./routes/admin");
const adminGenresRoutes = require("./routes/adminGenres");
const sitemapRoutes = require("./routes/sitemap");
const playerRoutes = require("./routes/api/player");
const chartsRoutes = require("./routes/api/charts");



const app = express();

/* =========================
   DATABASE
========================= */
connectDB().then(() => {
  console.log("DB connected, starting chart scheduler...");
  require("./services/chartScheduler");
});
/* =========================
   BASIC CONFIGURATION
========================= */

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

/* =========================
   SESSION CONFIG
========================= */
/* =========================
   SESSION CONFIG
========================= */

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);





app.use(flash())



app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

/* =========================
   GLOBAL VARIABLES
========================= */
app.use((req, res, next) => {

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  // Session
  res.locals.admin = req.session.admin || null;

  // Global site title
  res.locals.title = "SSD Beats";

  // Base URL (for images, media, SEO)
  res.locals.baseUrl = baseUrl;

  // SEO defaults
  res.locals.metaDescription =
    "SSD Beats - Discover trending songs, featured artists, albums and latest music news.";

  res.locals.metaKeywords =
    "music, songs, albums, artists, streaming, downloads, SSD Beats, South Sudan music";

  res.locals.ogImage = baseUrl + "/images/hero.png";

  res.locals.canonicalUrl = baseUrl + req.originalUrl;

  next();

});



// mobile menu contents in the header //
app.use(sidebarData);


/* =========================
   ROUTES
========================= */

// Admin
app.use("/admin", adminRoutes);
app.use("/admin/genres", adminGenresRoutes);

// Public
app.use("/", clientRoutes);

// Sitemap
app.use("/", sitemapRoutes);

app.use("/api/player", playerRoutes);

app.use("/api/charts", chartsRoutes);


app.use((req, res, next) => {
  res.locals.currentUrl =
    req.protocol + "://" + req.get("host") + req.originalUrl;
  next();
});

//sitemap
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(__dirname + "/sitemap.xml");
});



/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});