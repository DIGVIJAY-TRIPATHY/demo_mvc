const express = require("express");
const projectController = require("../controllers/project.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const csrf = require("../middlewares/csrf.middleware");
const rateLimit = require("../middlewares/rate-limit.middleware");
const {
  projectIdParam,
  userIdParam,
  requireProjectRole,
} = require("../middlewares/project.middleware");
const validate = require("../validators/project.validator");
const { UserRolesEnum, AvailableUserRole } = require("../utils/constants");
const { HttpError } = require("../utils/http-error");

const router = express.Router();

const ADMIN_ONLY = [UserRolesEnum.ADMIN];

// Admins can remove anyone; every other member can only remove themselves (leave)
function adminOrSelf(req, res, next) {
  const isAdmin = req.projectMember.role === UserRolesEnum.ADMIN;
  if (isAdmin || req.targetUserId === req.session.userId) return next();
  throw new HttpError(403, "You do not have permission to remove this member");
}

router.param("projectId", projectIdParam);
router.param("userId", userIdParam);

router.use(isAuthenticated);
// Checks the CSRF token on POST / PUT / DELETE (GET requests are ignored)
router.use(csrf.doubleCsrfProtection);

router
  .route("/")
  .get(projectController.getProjects)
  .post(validate.validateProject, projectController.createProject);

router
  .route("/:projectId")
  .get(requireProjectRole(AvailableUserRole), projectController.getProject)
  .put(
    requireProjectRole(ADMIN_ONLY),
    validate.validateProject,
    projectController.updateProject,
  )
  .delete(requireProjectRole(ADMIN_ONLY), projectController.deleteProject);

router
  .route("/:projectId/members")
  .get(requireProjectRole(AvailableUserRole), projectController.getMembers)
  .post(
    requireProjectRole(ADMIN_ONLY),
    rateLimit.addMemberLimiter,
    validate.validateAddMember,
    projectController.addMember,
  );

router
  .route("/:projectId/members/:userId")
  .put(
    requireProjectRole(ADMIN_ONLY),
    validate.validateRoleUpdate,
    projectController.updateMemberRole,
  )
  .delete(
    requireProjectRole(AvailableUserRole),
    adminOrSelf,
    projectController.removeMember,
  );

module.exports = router;
