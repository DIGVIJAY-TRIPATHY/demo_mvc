const { Sequelize } = require("sequelize");
const { env } = require("../config/env");

const sequelize = new Sequelize(
  env.database.name,
  env.database.username,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: "postgres",

    logging: env.nodeEnv === "development" ? console.log : false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = { sequelize };
