const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

const Subtask = sequelize.define(
  "Subtask",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    taskId: { type: DataTypes.INTEGER, allowNull: false, field: "task_id" },
    title: { type: DataTypes.STRING(200), allowNull: false },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_completed",
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: "created_by" },
  },
  { tableName: "subtasks", timestamps: true, underscored: true },
);

module.exports = { Subtask };
