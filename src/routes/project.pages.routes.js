const express = require("express");
const csrf = require("../middlewares/csrf.middleware");
const projectService = require("../services/project.service");
const {
  projectIdParam,
  requireProjectRole,
} = require("../middlewares/project.middleware");
const {
  UserRolesEnum,
  AvailableUserRole,
  RoleLabels,
} = require("../utils/constants");

const router = express.Router();

router.param("projectId", projectIdParam);

// Every project page needs a logged-in user
router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  next();
});

const token = (req, res) =>
  csrf.generateCsrfToken(req, res, { overwrite: true });

const roles = AvailableUserRole.map((value) => ({
  value,
  label: RoleLabels[value],
}));

router.get("/", async (req, res) => {
  const projects = await projectService.listProjectsForUser(req.session.userId);
  res.render("projects/index", {
    title: "Projects",
    csrfToken: token(req, res),
    projects,
    roleLabels: RoleLabels,
  });
});

// Must stay above "/:projectId" or "new" would be read as an id
router.get("/new", (req, res) => {
  res.render("projects/new", {
    title: "New project",
    csrfToken: token(req, res),
  });
});

router.get(
  "/:projectId",
  requireProjectRole(AvailableUserRole),
  async (req, res) => {
    const [project, members] = await Promise.all([
      projectService.getProject(req.projectId),
      projectService.listMembers(req.projectId),
    ]);

    res.render("projects/show", {
      title: project.name,
      csrfToken: token(req, res),
      project,
      members,
      myRole: req.projectMember.role,
      currentUserId: req.session.userId,
      roles,
      roleLabels: RoleLabels,
    });
  },
);

router.get(
  "/:projectId/edit",
  requireProjectRole([UserRolesEnum.ADMIN]),
  async (req, res) => {
    const project = await projectService.getProject(req.projectId);
    res.render("projects/edit", {
      title: "Edit project",
      csrfToken: token(req, res),
      project,
    });
  },
);

module.exports = router;
