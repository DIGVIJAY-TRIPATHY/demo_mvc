const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

// The table and its unique index (created_by, name) are defined in the migration.
const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      set(value) {
        this.setDataValue(
          "name",
          typeof value === "string" ? value.trim() : value,
        );
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    tableName: "projects",
    timestamps: true,
    underscored: true,
  },
);

module.exports = { Project };
