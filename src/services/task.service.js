const path = require("path");
const { sequelize, User, ProjectMember, Task, Subtask, TaskAttachment } = require("../models");
const { ManagerRoles, TaskStatusEnum, AvailableTaskStatuses } = require("../utils/constants");
const { HttpError } = require("../utils/http-error");
const { UPLOAD_DIR, removeStored } = require("../utils/upload.util");

const isManager = (role) => ManagerRoles.includes(role);

// ---------- shaping ----------
const userJson = (u) => (u ? { id: u.id, name: u.name } : null);

function toSubtaskJson(s) {
  return { id: s.id, title: s.title, isCompleted: s.isCompleted, createdAt: s.createdAt };
}

function toAttachmentJson(a) {
  return {
    id: a.id,
    originalName: a.originalName,
    mimetype: a.mimetype,
    size: a.size,
    createdAt: a.createdAt,
  };
}

function toTaskJson(task) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    assignedTo: task.assignedTo,
    assignee: userJson(task.assignee),
    creator: userJson(task.creator),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// ---------- helpers ----------
// Every lookup includes projectId, so a task from another project can never be touched
async function findTask(projectId, taskId, include = []) {
  const task = await Task.findOne({ where: { id: taskId, projectId }, include });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

async function assertAssigneeIsMember(projectId, userId) {
  if (userId === undefined || userId === null) return;
  const member = await ProjectMember.findOne({ where: { projectId, userId } });
  if (!member) {
    throw new HttpError(400, "The assigned user is not a member of this project");
  }
}

function attachmentRows(taskId, userId, files) {
  return (files || []).map((file) => ({
    taskId,
    originalName: path.basename(file.originalname).slice(0, 255),
    storedName: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    uploadedBy: userId,
  }));
}

const assigneeInclude = [
  { model: User, as: "assignee", attributes: ["id", "name"] },
  { model: User, as: "creator", attributes: ["id", "name"] },
];

// ---------- tasks ----------
async function listTasks(projectId, { status } = {}) {
  const where = { projectId };
  if (AvailableTaskStatuses.includes(status)) where.status = status;

  const tasks = await Task.findAll({
    where,
    include: assigneeInclude,
    order: [["createdAt", "DESC"]],
  });
  return tasks.map(toTaskJson);
}

async function getTask(projectId, taskId) {
  const task = await findTask(projectId, taskId, assigneeInclude);

  const [subtasks, attachments] = await Promise.all([
    Subtask.findAll({ where: { taskId }, order: [["createdAt", "ASC"]] }),
    TaskAttachment.findAll({ where: { taskId }, order: [["createdAt", "ASC"]] }),
  ]);

  return {
    ...toTaskJson(task),
    subtasks: subtasks.map(toSubtaskJson),
    attachments: attachments.map(toAttachmentJson),
  };
}

async function createTask(projectId, userId, data, files) {
  await assertAssigneeIsMember(projectId, data.assignedTo);

  const task = await sequelize.transaction(async (transaction) => {
    const created = await Task.create(
      {
        projectId,
        title: data.title,
        description: data.description || null,
        status: data.status || TaskStatusEnum.TODO,
        assignedTo: data.assignedTo ?? null,
        createdBy: userId,
      },
      { transaction },
    );
    const rows = attachmentRows(created.id, userId, files);
    if (rows.length) await TaskAttachment.bulkCreate(rows, { transaction });
    return created;
  });

  return getTask(projectId, task.id);
}

// actor = { id, role } of the logged-in user in this project
async function updateTask(projectId, taskId, actor, data, files) {
  const task = await findTask(projectId, taskId);
  const manager = isManager(actor.role);
  const isAssignee = task.assignedTo === actor.id;

  if (!manager && !isAssignee) {
    throw new HttpError(403, "You do not have permission to update this task");
  }

  // A plain assignee can only move the task between statuses
  if (!manager) {
    if (data.status === undefined) throw new HttpError(400, "Status is required");
    task.status = data.status;
    await task.save();
    return getTask(projectId, taskId);
  }

  if (data.assignedTo !== undefined) {
    await assertAssigneeIsMember(projectId, data.assignedTo);
    task.assignedTo = data.assignedTo;
  }
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description || null;
  if (data.status !== undefined) task.status = data.status;

  await sequelize.transaction(async (transaction) => {
    await task.save({ transaction });
    const rows = attachmentRows(task.id, actor.id, files);
    if (rows.length) await TaskAttachment.bulkCreate(rows, { transaction });
  });

  return getTask(projectId, taskId);
}

async function deleteTask(projectId, taskId) {
  const task = await findTask(projectId, taskId);
  const attachments = await TaskAttachment.findAll({ where: { taskId } });

  // subtasks and attachment rows are removed by the database (ON DELETE CASCADE)
  await task.destroy();
  await removeStored(attachments.map((a) => a.storedName));
}

// ---------- subtasks ----------
async function createSubtask(projectId, taskId, userId, title) {
  await findTask(projectId, taskId);
  const subtask = await Subtask.create({ taskId, title, createdBy: userId });
  return toSubtaskJson(subtask);
}

async function findSubtask(taskId, subtaskId) {
  const subtask = await Subtask.findOne({ where: { id: subtaskId, taskId } });
  if (!subtask) throw new HttpError(404, "Subtask not found");
  return subtask;
}

async function updateSubtask(projectId, taskId, subtaskId, actor, data) {
  const task = await findTask(projectId, taskId);
  const subtask = await findSubtask(taskId, subtaskId);

  const allowed = isManager(actor.role) || task.assignedTo === actor.id;
  if (!allowed) {
    throw new HttpError(403, "You do not have permission to update this subtask");
  }

  if (data.title !== undefined) subtask.title = data.title;
  if (data.isCompleted !== undefined) subtask.isCompleted = data.isCompleted;
  await subtask.save();
  return toSubtaskJson(subtask);
}

async function deleteSubtask(projectId, taskId, subtaskId) {
  await findTask(projectId, taskId);
  const subtask = await findSubtask(taskId, subtaskId);
  await subtask.destroy();
}

// ---------- attachments ----------
async function findAttachment(projectId, taskId, attachmentId) {
  await findTask(projectId, taskId);
  const attachment = await TaskAttachment.findOne({ where: { id: attachmentId, taskId } });
  if (!attachment) throw new HttpError(404, "Attachment not found");
  return attachment;
}

async function getAttachmentFile(projectId, taskId, attachmentId) {
  const attachment = await findAttachment(projectId, taskId, attachmentId);
  return {
    filePath: path.join(UPLOAD_DIR, path.basename(attachment.storedName)),
    name: attachment.originalName,
  };
}

async function deleteAttachment(projectId, taskId, attachmentId) {
  const attachment = await findAttachment(projectId, taskId, attachmentId);
  await attachment.destroy();
  await removeStored([attachment.storedName]);
}

module.exports = {
  isManager,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getAttachmentFile,
  deleteAttachment,
};
