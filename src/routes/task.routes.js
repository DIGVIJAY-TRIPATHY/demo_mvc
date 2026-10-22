const express = require("express");
const taskController = require("../controllers/task.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const csrf = require("../middlewares/csrf.middleware");
const { uploadAttachments } = require("../middlewares/upload.middleware");
const {
  numericParam,
  projectScope,
  requireProjectRole,
} = require("../middlewares/project.middleware");
const validate = require("../validators/task.validator");
const { AvailableUserRole, ManagerRoles } = require("../utils/constants");

// Mounted at /api/projects/:projectId/tasks
const router = express.Router({ mergeParams: true });

router.param("taskId", numericParam("taskId", "Task"));
router.param("subtaskId", numericParam("subtaskId", "Subtask"));
router.param("attachmentId", numericParam("attachmentId", "Attachment"));

router.use(isAuthenticated);
router.use(csrf.doubleCsrfProtection); // POST / PUT / DELETE only
router.use(projectScope);

const ANY_MEMBER = requireProjectRole(AvailableUserRole);
const MANAGERS = requireProjectRole(ManagerRoles);

// Managers can send files; a plain assignee only changes the status (JSON)
function uploadForManagers(req, res, next) {
  if (ManagerRoles.includes(req.projectMember.role)) {
    return uploadAttachments(req, res, next);
  }
  next();
}

router
  .route("/")
  .get(ANY_MEMBER, taskController.getTasks)
  .post(MANAGERS, uploadAttachments, validate.validateTaskCreate, taskController.createTask);

router
  .route("/:taskId")
  .get(ANY_MEMBER, taskController.getTask)
  .put(ANY_MEMBER, uploadForManagers, validate.validateTaskUpdate, taskController.updateTask)
  .delete(MANAGERS, taskController.deleteTask);

router.post("/:taskId/subtasks", MANAGERS, validate.validateSubtask, taskController.createSubtask);

router
  .route("/:taskId/subtasks/:subtaskId")
  .put(ANY_MEMBER, validate.validateSubtaskUpdate, taskController.updateSubtask)
  .delete(MANAGERS, taskController.deleteSubtask);

router
  .route("/:taskId/attachments/:attachmentId")
  .get(ANY_MEMBER, taskController.downloadAttachment)
  .delete(MANAGERS, taskController.deleteAttachment);

module.exports = router;
