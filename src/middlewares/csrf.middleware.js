const { doubleCsrf } = require("csrf-csrf");
const { env } = require("../config/env");

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.csrfSecret,
  // Token is bound to the session. Anonymous visitors only get a stable
  // session id once the session is saved -> see initSession below.
  getSessionIdentifier: (req) => req.sessionID,
  // __Host- prefix requires Secure + Path=/, so only use it in production
  cookieName: env.isProduction
    ? "__Host-project_camp.csrf"
    : "project_camp.csrf",
  cookieOptions: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  },
  // Header for fetch/AJAX, hidden `_csrf` field for EJS forms
  getCsrfTokenFromRequest: (req) =>
    req.headers["x-csrf-token"] || (req.body && req.body._csrf),
});

// With `saveUninitialized: false` an anonymous visitor gets a brand-new
// session id on every request, so CSRF tokens could never validate.
// Writing to the session forces it to be saved and the cookie to be set.
// Use it on the csrf-token route and on every route that renders a form.
function initSession(req, res, next) {
  if (!req.session.initialized) {
    req.session.initialized = true;
  }
  next();
}

module.exports = { generateCsrfToken, doubleCsrfProtection, initSession };
