const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit.middleware");
const csrfMiddleware = require("../middlewares/csrf.middleware");

const router = express.Router();

router.post(
  "/register",
  rateLimitMiddleware.registerLimiter,
  authController.register,
);

router.post("/login", rateLimitMiddleware.loginLimiter, authController.login);

router.get("/me", authMiddleware.isAuthenticated, authController.getProfile);

router.post(
  "/logout",
  authMiddleware.isAuthenticated,
  csrfMiddleware.doubleCsrfProtection,
  authController.logout,
);

router.get("/verify-email", authController.verifyEmail);

router.post(
  "/resend-verification",
  rateLimitMiddleware.resendVerificationLimiter,
  authController.resendVerificationEmail,
);

router.get("/csrf-token", (req, res) => {
  const csrfToken = csrfMiddleware.generateCsrfToken(req, res);

  return res.status(200).json({
    success: true,
    csrfToken,
  });
});

router.post(
  "/forgot-password",
  rateLimitMiddleware.resendVerificationLimiter,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  rateLimitMiddleware.resendVerificationLimiter,
  authController.resetPassword,
);

module.exports = router;
