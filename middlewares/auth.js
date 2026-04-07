exports.requireAdmin = (req, res, next) => {
  if (!req.session.admin) {
    req.flash("error", "Please login first");
    return res.redirect("/admin/login");
  }
  next();
};