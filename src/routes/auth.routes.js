const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const rateLimit = require("../middlewares/rate-limit.middleware");
const csrf = require("../middlewares/csrf.middleware");
const validate = require("../validators/auth.validator");

const router = express.Router();

// Client must call this first (it also starts the session), then send the
// token back in the `x-csrf-token` header or a hidden `_csrf` form field.
router.get("/csrf-token", csrf.initSession, (req, res) => {
  const csrfToken = csrf.generateCsrfToken(req, res);
  return res.status(200).json({ success: true, csrfToken });
});

router.post(
  "/register",
  rateLimit.registerLimiter,
  csrf.doubleCsrfProtection,
  validate.validateRegister,
  authController.register,
);

router.post(
  "/login",
  rateLimit.loginLimiter,
  csrf.doubleCsrfProtection,
  validate.validateLogin,
  authController.login,
);

router.get("/me", authMiddleware.isAuthenticated, authController.getProfile);

router.post(
  "/logout",
  authMiddleware.isAuthenticated,
  csrf.doubleCsrfProtection,
  authController.logout,
);

router.get(
  "/verify-email",
  validate.validateVerifyEmailQuery,
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  rateLimit.resendVerificationLimiter,
  csrf.doubleCsrfProtection,
  validate.validateEmailBody,
  authController.resendVerificationEmail,
);

router.post(
  "/forgot-password",
  rateLimit.forgotPasswordLimiter,
  csrf.doubleCsrfProtection,
  validate.validateEmailBody,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  rateLimit.resetPasswordLimiter,
  csrf.doubleCsrfProtection,
  validate.validateResetPassword,
  authController.resetPassword,
);

router.post(
  "/change-password",
  authMiddleware.isAuthenticated,
  rateLimit.changePasswordLimiter,
  csrf.doubleCsrfProtection,
  validate.validateChangePassword,
  authController.changePassword,
);

module.exports = router;
