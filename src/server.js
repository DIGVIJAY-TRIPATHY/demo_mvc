const app = require("./app");
const { env } = require("./config/env");
const { sequelize } = require("./db/sequelize");
const { sessionStore } = require("./config/session");
const { User } = require("./models/user.model");
// const { verifyMailConnection } = require('./config/mail')

async function startServer() {
  try {
    // Verify the database connection
    await sequelize.authenticate();
    await sessionStore.sync();
    await User.sync({ alter: true });
    console.log("Session store initialized successfully.");
    console.log("Users table initialized successfully.");

    console.log("PostgreSQL connection established successfully.");

    // Start accepting HTTP requests
    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
    // verifyMailConnection()
  } catch (error) {
    console.error("Failed to start the server:");
    console.error(error.message);

    await sequelize.close().catch(() => {});
    process.exitCode = 1;
  }
}

startServer();
