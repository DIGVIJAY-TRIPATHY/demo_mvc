const app = require("./app");
const { env } = require("./config/env");
const { sequelize } = require("./db/sequelize");
const { sessionStore } = require("./config/session");
// const { verifyMailConnection } = require("./config/mail");

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connection established successfully.");

    // Only the sessions table is synced here.
    // App tables (users, ...) are managed by migrations: `npm run migrate`
    await sessionStore.sync();
    console.log("Session store initialized successfully.");

    const server = app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
    // verifyMailConnection();

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await sequelize.close().catch(() => {});
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start the server:");
    console.error(error.message);

    await sequelize.close().catch(() => {});
    process.exitCode = 1;
  }
}

startServer();
