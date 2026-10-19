const { sequelize } = require("./src/db/sequelize");

async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:");
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

testDatabaseConnection();
