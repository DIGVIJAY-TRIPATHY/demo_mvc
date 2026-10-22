// Used only by sequelize-cli (npm run migrate). Reads .env directly so the
// CLI doesn't need SESSION_SECRET / SMTP settings.
require("dotenv").config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: "postgres",
};

module.exports = { development: base, test: base, production: base };
