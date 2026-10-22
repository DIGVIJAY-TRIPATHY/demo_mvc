const { AvailableTaskStatuses } = require("../utils/constants");
const { removeFiles } = require("../utils/upload.util");

const isString = (v) => typeof v === "string";

// Uploaded files are already on disk when validation runs, so delete them on failure
async function fail(req, res, errors) {
  await removeFiles(req.files);
  return res.status(400).json({ success: false, message: "Validation failed", errors });
}

// undefined = not sent, null = unassign, number = user id
function parseAssignee(value, errors) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (isString(value) && /^\d{1,9}$/.test(value)) return Number(value);
  errors.push({ field: "assignedTo", message: "Assigned user is invalid" });
  return undefined;
}

function checkTitle(value, errors, label = "Task title") {
  if (!isString(value) || !value.trim()) {
    errors.push({ field: "title", message: `${label} is required` });
  } else if (value.trim().length > 200) {
    errors.push({ field: "title", message: `${label} must be at most 200 characters` });
  }
}

function checkCommon(body, errors) {
  if (body.description !== undefined && body.description !== null) {
    if (!isString(body.description)) {
      errors.push({ field: "description", message: "Description must be text" });
    } else if (body.description.length > 2000) {
      errors.push({ field: "description", message: "Description must be at most 2000 characters" });
    }
  }
  if (body.status !== undefined && !AvailableTaskStatuses.includes(body.status)) {
    errors.push({ field: "status", message: "Choose a valid status" });
  }
}

async function validateTaskCreate(req, res, next) {
  const body = req.body || {};
  const errors = [];

  checkTitle(body.title, errors);
  checkCommon(body, errors);
  const assignedTo = parseAssignee(body.assignedTo, errors);

  if (errors.length) return fail(req, res, errors);

  req.body = {
    title: body.title.trim(),
    description: isString(body.description) ? body.description.trim() : "",
    status: body.status,
    assignedTo,
  };
  next();
}

// Managers send everything, a plain assignee only sends { status }
async function validateTaskUpdate(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (body.title !== undefined) checkTitle(body.title, errors);
  checkCommon(body, errors);
  const assignedTo = parseAssignee(body.assignedTo, errors);

  if (errors.length) return fail(req, res, errors);

  req.body = {
    title: isString(body.title) ? body.title.trim() : undefined,
    description: isString(body.description) ? body.description.trim() : undefined,
    status: body.status,
    assignedTo,
  };
  next();
}

function validateSubtask(req, res, next) {
  const errors = [];
  checkTitle((req.body || {}).title, errors, "Subtask title");

  if (errors.length) return fail(req, res, errors);
  req.body = { title: req.body.title.trim() };
  next();
}

function validateSubtaskUpdate(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (body.title !== undefined) checkTitle(body.title, errors, "Subtask title");
  if (body.isCompleted !== undefined && typeof body.isCompleted !== "boolean") {
    errors.push({ field: "isCompleted", message: "isCompleted must be true or false" });
  }
  if (body.title === undefined && body.isCompleted === undefined) {
    errors.push({ field: "title", message: "Nothing to update" });
  }

  if (errors.length) return fail(req, res, errors);
  req.body = {
    title: isString(body.title) ? body.title.trim() : undefined,
    isCompleted: body.isCompleted,
  };
  next();
}

module.exports = {
  validateTaskCreate,
  validateTaskUpdate,
  validateSubtask,
  validateSubtaskUpdate,
};
