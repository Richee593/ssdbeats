// middleware/auth.js

exports.requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    return res.redirect("/admin/login");
  }
  next();
};


exports.adminSessionTimeout = (req, res, next) => {
  try {
    // no session → continue
    if (!req.session || !req.session.admin) {
      return next();
    }

    const sessionTimeout = 1000 * 60 * 60 * 2; // 2 hours
    const now = Date.now();

    // if loginTime missing, set it
    if (!req.session.admin.loginTime) {
      req.session.admin.loginTime = now;
      return next();
    }

    const diff = now - req.session.admin.loginTime;

    // session expired
    if (diff > sessionTimeout) {
      return req.session.destroy(() => {
        return res.redirect("/admin/login");
      });
    }

    // refresh session activity (sliding timeout)
    req.session.admin.loginTime = now;

    next();

  } catch (error) {
    console.error("Session timeout middleware error:", error);
    next();
  }
};