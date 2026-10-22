const { AvailableUserRole } = require("../utils/constants");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isString = (v) => typeof v === "string";

function fail(res, errors) {
  return res
    .status(400)
    .json({ success: false, message: "Validation failed", errors });
}

function validateProject(req, res, next) {
  const { name, description } = req.body || {};
  const errors = [];

  if (!isString(name) || !name.trim()) {
    errors.push({ field: "name", message: "Project name is required" });
  } else if (name.trim().length > 120) {
    errors.push({
      field: "name",
      message: "Project name must be at most 120 characters",
    });
  }

  if (description !== undefined && description !== null) {
    if (!isString(description)) {
      errors.push({
        field: "description",
        message: "Description must be text",
      });
    } else if (description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description must be at most 1000 characters",
      });
    }
  }

  if (errors.length) return fail(res, errors);

  req.body.name = name.trim();
  req.body.description = isString(description) ? description.trim() : "";
  next();
}

function validateAddMember(req, res, next) {
  const { email, role } = req.body || {};
  const errors = [];

  if (!isString(email) || !EMAIL_RE.test(email.trim()) || email.length > 255) {
    errors.push({ field: "email", message: "Enter a valid email address" });
  }
  if (!AvailableUserRole.includes(role)) {
    errors.push({ field: "role", message: "Choose a valid role" });
  }

  return errors.length ? fail(res, errors) : next();
}

function validateRoleUpdate(req, res, next) {
  const { role } = req.body || {};

  if (!AvailableUserRole.includes(role)) {
    return fail(res, [{ field: "role", message: "Choose a valid role" }]);
  }
  next();
}

module.exports = { validateProject, validateAddMember, validateRoleUpdate };
