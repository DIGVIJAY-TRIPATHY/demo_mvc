const express = require("express");
const { User } = require("../models/user.model");
const csrf = require("../middlewares/csrf.middleware");
const projectService = require("../services/project.service");

const router = express.Router();

function guestOnly(req, res, next) {
  if (req.session.userId) return res.redirect("/dashboard");
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// Renders a page that contains a form. A fresh CSRF token is put in the
// <meta name="csrf-token"> tag and public/js/auth.js sends it with each request.
function formPage(view, title) {
  return (req, res) => {
    const csrfToken = csrf.generateCsrfToken(req, res, { overwrite: true });
    res.render(view, { title, csrfToken });
  };
}

// Reads a query value only if it is a plain string
function queryString(value) {
  return typeof value === "string" ? value : "";
}

router.get("/", (req, res) => {
  res.redirect(req.session.userId ? "/dashboard" : "/login");
});

router.get(
  "/login",
  guestOnly,
  csrf.initSession,
  formPage("auth/login", "Log in"),
);
router.get(
  "/register",
  guestOnly,
  csrf.initSession,
  formPage("auth/register", "Register"),
);
router.get(
  "/forgot-password",
  guestOnly,
  csrf.initSession,
  formPage("auth/forgot-password", "Forgot password"),
);
router.get(
  "/resend-verification",
  guestOnly,
  csrf.initSession,
  formPage("auth/resend-verification", "Resend verification"),
);

router.get("/reset-password", csrf.initSession, (req, res) => {
  const csrfToken = csrf.generateCsrfToken(req, res, { overwrite: true });
  res.render("auth/reset-password", {
    title: "Reset password",
    csrfToken,
    token: queryString(req.query.token),
    email: queryString(req.query.email),
  });
});

// The link in the verification email opens this page,
// and the page calls GET /api/auth/verify-email
router.get("/verify-email", (req, res) => {
  res.render("auth/verify-email", {
    title: "Verify email",
    token: queryString(req.query.token),
    email: queryString(req.query.email),
  });
});

router.get("/dashboard", requireLogin, async (req, res) => {
  const user = await User.findByPk(req.session.userId);

  if (!user) {
    return req.session.destroy(() => res.redirect("/login"));
  }

  const csrfToken = csrf.generateCsrfToken(req, res, { overwrite: true });
  const projects = await projectService.listProjectsForUser(user.id);
  res.render("dashboard/index", {
    title: "Dashboard",
    csrfToken,
    user,
    projects: projects.slice(0, 5),
    totalProjects: projects.length,
  });
});

router.get(
  "/change-password",
  requireLogin,
  formPage("auth/change-password", "Change password"),
);

module.exports = router;
