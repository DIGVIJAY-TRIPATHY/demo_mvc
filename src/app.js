const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { sessionMiddleware } = require("./config/session");
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");


const app = express();

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security-related HTTP headers
app.use(helmet());
    
// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(cookieParser());

// Serve static files such as CSS and JavaScript
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authRoutes);

// Basic health-check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Project Camp server is running",
  });
});

module.exports = app;
