const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");
const { AvailableUserRole, UserRolesEnum } = require("../utils/constants");

// The table and its unique index (project_id, user_id) are defined in the migration.
const ProjectMember = sequelize.define(
  "ProjectMember",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "project_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: UserRolesEnum.MEMBER,
      validate: { isIn: [AvailableUserRole] },
    },
  },
  {
    tableName: "project_members",
    timestamps: true,
    underscored: true,
  },
);

module.exports = { ProjectMember };
