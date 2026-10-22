const express = require("express");
const helmet = require("helmet");
const path = require("path");
const cookieParser = require("cookie-parser");
const { env } = require("./config/env");
const { sessionMiddleware } = require("./config/session");
const authRoutes = require("./routes/auth.routes");
const pagesRoutes = require("./routes/pages.routes");
const projectRoutes = require("./routes/project.routes");
const projectPageRoutes = require("./routes/project.pages.routes");
const taskRoutes = require("./routes/task.routes");
const taskPageRoutes = require("./routes/task.pages.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// Needed behind nginx / a load balancer so req.ip, rate limiting and
// secure cookies work correctly. Set TRUST_PROXY=1 in production.
if (env.trustProxy > 0) {
  app.set("trust proxy", env.trustProxy);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(helmet());

// Static files and health check come BEFORE the session so they
// don't hit the sessions table on every request.
// Static folder is /public at the project root (matches your README).
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Project Camp server is running" });
});

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(sessionMiddleware);

// Lets every EJS view know whether someone is logged in (used by the header)
app.use((req, res, next) => {
  res.locals.isLoggedIn = Boolean(req.session && req.session.userId);
  next();
});

app.use("/api/auth", authRoutes);
// Task routers go first: they are nested under /:projectId/tasks
app.use("/api/projects/:projectId/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/", pagesRoutes);
app.use("/projects/:projectId/tasks", taskPageRoutes);
app.use("/projects", projectPageRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
