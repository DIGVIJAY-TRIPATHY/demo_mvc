const { ProjectMember } = require("../models");
const { AvailableUserRole } = require("../utils/constants");
const { HttpError } = require("../utils/http-error");

// router.param("projectId", projectIdParam) - rejects ids like "abc" early
function projectIdParam(req, res, next, value) {
  if (!/^\d{1,9}$/.test(value)) {
    return next(new HttpError(404, "Project not found"));
  }
  req.projectId = Number(value);
  next();
}

function userIdParam(req, res, next, value) {
  if (!/^\d{1,9}$/.test(value)) {
    return next(new HttpError(404, "User not found"));
  }
  req.targetUserId = Number(value);
  next();
}

// Allows the request only if the logged-in user belongs to the project
// with one of the given roles. Sets req.projectMember for later use.
// Non-members get 404 so the existence of other people's projects isn't revealed.
function requireProjectRole(allowedRoles = AvailableUserRole) {
  return async (req, res, next) => {
    const membership = await ProjectMember.findOne({
      where: { projectId: req.projectId, userId: req.session.userId },
    });

    if (!membership) {
      throw new HttpError(404, "Project not found");
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new HttpError(403, "You do not have permission to do that in this project");
    }

    req.projectMember = membership;
    next();
  };
}

// router.param("taskId", numericParam("taskId", "Task")) -> sets req.taskId
function numericParam(key, label) {
  return (req, res, next, value) => {
    if (!/^\d{1,9}$/.test(value)) {
      return next(new HttpError(404, `${label} not found`));
    }
    req[key] = Number(value);
    next();
  };
}

// For routers mounted at ".../:projectId/..." with mergeParams: true
function projectScope(req, res, next) {
  return projectIdParam(req, res, next, req.params.projectId);
}

module.exports = {
  projectIdParam,
  userIdParam,
  numericParam,
  projectScope,
  requireProjectRole,
};
