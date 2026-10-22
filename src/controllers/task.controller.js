const taskService = require("../services/task.service");
const { HttpError } = require("../utils/http-error");
const { removeFiles } = require("../utils/upload.util");

const actorOf = (req) => ({ id: req.session.userId, role: req.projectMember.role });

async function getTasks(req, res) {
  const tasks = await taskService.listTasks(req.projectId, { status: req.query.status });
  return res.status(200).json({ success: true, tasks });
}

async function getTask(req, res) {
  const task = await taskService.getTask(req.projectId, req.taskId);
  return res.status(200).json({ success: true, task });
}

async function createTask(req, res) {
  try {
    const task = await taskService.createTask(
      req.projectId,
      req.session.userId,
      req.body,
      req.files,
    );
    return res.status(201).json({ success: true, message: "Task created successfully", task });
  } catch (error) {
    await removeFiles(req.files); // don't keep uploads for a task that failed
    throw error;
  }
}

async function updateTask(req, res) {
  try {
    const task = await taskService.updateTask(
      req.projectId,
      req.taskId,
      actorOf(req),
      req.body,
      req.files,
    );
    return res.status(200).json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    await removeFiles(req.files);
    throw error;
  }
}

async function deleteTask(req, res) {
  await taskService.deleteTask(req.projectId, req.taskId);
  return res.status(200).json({ success: true, message: "Task deleted successfully" });
}

async function createSubtask(req, res) {
  const subtask = await taskService.createSubtask(
    req.projectId,
    req.taskId,
    req.session.userId,
    req.body.title,
  );
  return res.status(201).json({ success: true, message: "Subtask added", subtask });
}

async function updateSubtask(req, res) {
  const subtask = await taskService.updateSubtask(
    req.projectId,
    req.taskId,
    req.subtaskId,
    actorOf(req),
    req.body,
  );
  return res.status(200).json({ success: true, message: "Subtask updated", subtask });
}

async function deleteSubtask(req, res) {
  await taskService.deleteSubtask(req.projectId, req.taskId, req.subtaskId);
  return res.status(200).json({ success: true, message: "Subtask deleted" });
}

// Always sent as a download, never rendered in the browser
async function downloadAttachment(req, res, next) {
  const { filePath, name } = await taskService.getAttachmentFile(
    req.projectId,
    req.taskId,
    req.attachmentId,
  );
  res.download(filePath, name, (error) => {
    if (error && !res.headersSent) next(new HttpError(404, "File not found"));
  });
}

async function deleteAttachment(req, res) {
  await taskService.deleteAttachment(req.projectId, req.taskId, req.attachmentId);
  return res.status(200).json({ success: true, message: "Attachment deleted" });
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  downloadAttachment,
  deleteAttachment,
};
