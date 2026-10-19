const { doubleCsrf } = require("csrf-csrf");
const { env } = require("../config/env");


const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.sessionSecret,
  getSessionIdentifier: (req) => req.sessionID,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  },
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

module.exports = {
  generateCsrfToken,
  doubleCsrfProtection,
};
