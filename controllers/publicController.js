exports.home = (req, res) => {
  res.render("index", { title: "Home" });
};

exports.artist = (req, res) => {
  res.render("artist", {
    title: "Artist",
    artistId: req.params.id,
  });
};