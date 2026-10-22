const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../models/user.model");
const { generateVerificationToken } = require("../utils/token");
const { destroyUserSessions } = require("../utils/session.util.js");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require("../services/email.service");
const { generateCsrfToken } = require("../middlewares/csrf.middleware");

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TTL_MS = 60 * 60 * 1000; // 60 minutes
const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_COOKIE = "project_camp.sid";

// Compared against when the email is unknown, so login takes the same time
// whether or not the account exists (prevents timing-based user enumeration).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const regenerateSession = (req) =>
  new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );

const saveSession = (req) =>
  new Promise((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );

const destroySession = (req) =>
  new Promise((resolve, reject) =>
    req.session.destroy((err) => (err ? reject(err) : resolve())),
  );

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

// Express 5 forwards rejected promises to the error middleware,
// so unexpected errors are simply thrown.

async function register(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email is already registered",
    });
  }

  const { token, tokenHash } = generateVerificationToken();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    // Save the user FIRST, then send the email
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }
    throw error;
  }

  let emailSent = true;
  try {
    await sendVerificationEmail(normalizedEmail, token);
  } catch (error) {
    emailSent = false;
    console.error("Verification email failed:", error.message);
  }

  return res.status(201).json({
    success: true,
    emailSent,
    message: emailSent
      ? "Registered successfully. Please check your email to verify your account."
      : "Registered, but we could not send the verification email. Please use 'resend verification'.",
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  const passwordMatches = await bcrypt.compare(
    password,
    user ? user.passwordHash : DUMMY_HASH,
  );

  if (!user || !passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in.",
    });
  }

  // New session id after authentication (prevents session fixation)
  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);

  // The session id changed, so the old CSRF token is no longer valid.
  // Issue a fresh one for the new session.
  const csrfToken = generateCsrfToken(req, res, { overwrite: true });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    csrfToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

async function getProfile(req, res) {
  const user = await User.findByPk(req.session.userId);

  if (!user) {
    // Account was deleted but the session still exists
    await destroySession(req);
    clearSessionCookie(res);
    return res
      .status(401)
      .json({ success: false, message: "Please log in first" });
  }

  return res.status(200).json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

async function logout(req, res) {
  await destroySession(req);
  clearSessionCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

async function verifyEmail(req, res) {
  const { token, email } = req.query;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.unscoped().findOne({
    where: {
      email: email.trim().toLowerCase(),
      emailVerificationTokenHash: tokenHash,
    },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid verification link" });
  }

  if (
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt <= new Date()
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Verification link has expired" });
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  return res
    .status(200)
    .json({ success: true, message: "Email verified successfully" });
}

async function resendVerificationEmail(req, res) {
  const normalizedEmail = req.body.email.trim().toLowerCase();

  // Same response whether or not the account exists
  const successResponse = {
    success: true,
    message:
      "If an unverified account exists, a verification email will be sent.",
  };

  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (!user || user.emailVerified) {
    return res.status(200).json(successResponse);
  }

  const { token, tokenHash } = generateVerificationToken();

  // Save the new token FIRST, then send the email that contains it
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await user.save();

  // Respond immediately and send in the background, so response time
  // doesn't reveal whether the account exists.
  sendVerificationEmail(user.email, token).catch((error) => {
    console.error("Resend verification email failed:", error.message);
  });

  return res.status(200).json(successResponse);
}

// ---------- Password flows ----------

// POST /api/auth/forgot-password   { email }
async function forgotPassword(req, res) {
  const normalizedEmail = req.body.email.trim().toLowerCase();

  // Same response whether or not the account exists
  const successResponse = {
    success: true,
    message:
      "If an account with that email exists, a password reset link will be sent.",
  };

  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(200).json(successResponse);
  }

  const { token, tokenHash } = generateVerificationToken();

  // Save the hashed token FIRST, then email the raw token
  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  // Send in the background so response time doesn't reveal if the account exists
  sendPasswordResetEmail(user.email, token).catch((error) => {
    console.error("Password reset email failed:", error.message);
  });

  return res.status(200).json(successResponse);
}

// POST /api/auth/reset-password   { token, email, newPassword, confirmPassword? }
async function resetPassword(req, res) {
  const { token, email, newPassword } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.unscoped().findOne({
    where: {
      email: email.trim().toLowerCase(),
      passwordResetTokenHash: tokenHash,
    },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired reset link" });
  }

  if (
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt <= new Date()
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired reset link" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // One-time use: clear the token so the link can't be reused
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  // Log the user out everywhere (someone else may have had access)
  await destroyUserSessions(user.id);

  sendPasswordChangedEmail(user.email).catch((error) => {
    console.error("Password changed email failed:", error.message);
  });

  return res.status(200).json({
    success: true,
    message:
      "Password reset successfully. Please log in with your new password.",
  });
}

// POST /api/auth/change-password   { currentPassword, newPassword, confirmPassword? }
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await User.unscoped().findByPk(req.session.userId);

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Please log in first" });
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Also invalidate any pending reset link
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  // Rotate THIS session id (the password is a privilege change)...
  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);

  // ...then log out every OTHER device
  await destroyUserSessions(user.id, req.sessionID);

  // Session id changed, so issue a fresh CSRF token for it
  const csrfToken = generateCsrfToken(req, res, { overwrite: true });

  sendPasswordChangedEmail(user.email).catch((error) => {
    console.error("Password changed email failed:", error.message);
  });

  return res.status(200).json({
    success: true,
    message:
      "Password changed successfully. Other devices have been logged out.",
    csrfToken,
  });
}

module.exports = {
  register,
  login,
  getProfile,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
