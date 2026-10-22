require("dotenv").config();

const required = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "SESSION_SECRET",
  "CSRF_SECRET",
  "APP_BASE_URL",
  "EMAIL_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}`,
  );
}

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  for (const key of ["SESSION_SECRET", "CSRF_SECRET"]) {
    if (process.env[key].length < 32) {
      throw new Error(`${key} must be at least 32 characters in production`);
    }
  }
}

const smtpPort = Number(process.env.SMTP_PORT);
if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
  throw new Error("SMTP_PORT must be a valid port number");
}

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 3000,
  appBaseUrl: process.env.APP_BASE_URL.replace(/\/+$/, ""),
  // Number of reverse proxies in front of the app (0 = none)
  trustProxy: Number(process.env.TRUST_PROXY) || 0,

  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  sessionSecret: process.env.SESSION_SECRET,
  csrfSecret: process.env.CSRF_SECRET,

  mail: {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
};

module.exports = { env };
