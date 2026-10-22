const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");
const { AvailableTaskStatuses, TaskStatusEnum } = require("../utils/constants");

const Task = sequelize.define(
  "Task",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false, field: "project_id" },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: TaskStatusEnum.TODO,
      validate: { isIn: [AvailableTaskStatuses] },
    },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true, field: "assigned_to" },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: "created_by" },
  },
  { tableName: "tasks", timestamps: true, underscored: true },
);

module.exports = { Task };
