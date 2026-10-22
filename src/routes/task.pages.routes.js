const express = require("express");
const csrf = require("../middlewares/csrf.middleware");
const projectService = require("../services/project.service");
const taskService = require("../services/task.service");
const {
  numericParam,
  projectScope,
  requireProjectRole,
} = require("../middlewares/project.middleware");
const {
  AvailableUserRole,
  ManagerRoles,
  AvailableTaskStatuses,
  TaskStatusLabels,
} = require("../utils/constants");

// Mounted at /projects/:projectId/tasks
const router = express.Router({ mergeParams: true });

router.param("taskId", numericParam("taskId", "Task"));

router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  next();
});
router.use(projectScope);

const ANY_MEMBER = requireProjectRole(AvailableUserRole);
const MANAGERS = requireProjectRole(ManagerRoles);

const token = (req, res) => csrf.generateCsrfToken(req, res, { overwrite: true });
const statuses = AvailableTaskStatuses.map((value) => ({ value, label: TaskStatusLabels[value] }));

router.get("/", ANY_MEMBER, async (req, res) => {
  const [project, tasks] = await Promise.all([
    projectService.getProject(req.projectId),
    taskService.listTasks(req.projectId, { status: req.query.status }),
  ]);

  res.render("tasks/index", {
    title: "Tasks",
    csrfToken: token(req, res),
    project,
    tasks,
    manager: ManagerRoles.includes(req.projectMember.role),
    statuses,
    statusLabels: TaskStatusLabels,
    activeStatus: AvailableTaskStatuses.includes(req.query.status) ? req.query.status : "",
  });
});

// Must stay above "/:taskId" or "new" would be read as an id
router.get("/new", MANAGERS, async (req, res) => {
  const [project, members] = await Promise.all([
    projectService.getProject(req.projectId),
    projectService.listMembers(req.projectId),
  ]);
  res.render("tasks/new", { title: "New task", csrfToken: token(req, res), project, members, statuses });
});

router.get("/:taskId", ANY_MEMBER, async (req, res) => {
  const [project, task] = await Promise.all([
    projectService.getProject(req.projectId),
    taskService.getTask(req.projectId, req.taskId),
  ]);

  const manager = ManagerRoles.includes(req.projectMember.role);
  const isAssignee = task.assignedTo === req.session.userId;

  res.render("tasks/show", {
    title: task.title,
    csrfToken: token(req, res),
    project,
    task,
    manager,
    canUpdate: manager || isAssignee,
    statuses,
    statusLabels: TaskStatusLabels,
  });
});

router.get("/:taskId/edit", MANAGERS, async (req, res) => {
  const [project, task, members] = await Promise.all([
    projectService.getProject(req.projectId),
    taskService.getTask(req.projectId, req.taskId),
    projectService.listMembers(req.projectId),
  ]);
  res.render("tasks/edit", { title: "Edit task", csrfToken: token(req, res), project, task, members, statuses });
});

module.exports = router;
