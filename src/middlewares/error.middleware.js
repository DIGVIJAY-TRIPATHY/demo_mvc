const { env } = require("../config/env");

function wantsJson(req) {
  return (
    req.originalUrl.startsWith("/api") ||
    req.accepts(["html", "json"]) === "json"
  );
}

function notFound(req, res) {
  const message = "Route not found";
  if (wantsJson(req)) {
    return res.status(404).json({ success: false, message });
  }
  return res.status(404).render("errors/404", { title: "Page not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  // Never leak internals for 5xx errors
  const message = status >= 500 ? "Internal server error" : err.message;
  const body = { success: false, message };
  if (!env.isProduction && status >= 500) body.stack = err.stack;

  if (wantsJson(req)) {
    return res.status(status).json(body);
  }
  return res.status(status).render("errors/error", { title: "Error", message });
}

module.exports = { notFound, errorHandler };
