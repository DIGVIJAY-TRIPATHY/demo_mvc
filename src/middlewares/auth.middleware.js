function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Please log in first",
    });
  }

  next();
}

module.exports = { isAuthenticated };
