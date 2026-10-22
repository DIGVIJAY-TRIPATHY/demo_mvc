// Loads every model and defines how they relate.
// Import models from here ("../models") so the associations always exist.
const { sequelize } = require("../db/sequelize");
const { User } = require("./user.model");
const { Project } = require("./project.model");
const { ProjectMember } = require("./project-member.model");
const { Task } = require("./task.model");
const { Subtask } = require("./subtask.model");
const { TaskAttachment } = require("./task-attachment.model");

User.hasMany(Project, { foreignKey: "createdBy", as: "ownedProjects" });
Project.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Project.hasMany(ProjectMember, { foreignKey: "projectId", as: "memberships", onDelete: "CASCADE" });
ProjectMember.belongsTo(Project, { foreignKey: "projectId", as: "project" });
User.hasMany(ProjectMember, { foreignKey: "userId", as: "memberships", onDelete: "CASCADE" });
ProjectMember.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(Task, { foreignKey: "projectId", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Task.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });
Task.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Task.hasMany(Subtask, { foreignKey: "taskId", as: "subtasks", onDelete: "CASCADE" });
Subtask.belongsTo(Task, { foreignKey: "taskId", as: "task" });

Task.hasMany(TaskAttachment, { foreignKey: "taskId", as: "attachments", onDelete: "CASCADE" });
TaskAttachment.belongsTo(Task, { foreignKey: "taskId", as: "task" });

module.exports = { sequelize, User, Project, ProjectMember, Task, Subtask, TaskAttachment };
