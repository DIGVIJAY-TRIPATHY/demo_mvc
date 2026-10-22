const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

const TaskAttachment = sequelize.define(
  "TaskAttachment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    taskId: { type: DataTypes.INTEGER, allowNull: false, field: "task_id" },
    originalName: { type: DataTypes.STRING(255), allowNull: false, field: "original_name" },
    storedName: { type: DataTypes.STRING(100), allowNull: false, field: "stored_name" },
    mimetype: { type: DataTypes.STRING(100), allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    uploadedBy: { type: DataTypes.INTEGER, allowNull: true, field: "uploaded_by" },
  },
  { tableName: "task_attachments", timestamps: true, underscored: true },
);

module.exports = { TaskAttachment };
