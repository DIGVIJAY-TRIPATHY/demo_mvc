const rateLimit = require("express-rate-limit");

function createLimiter({
  limit,
  message,
  skipSuccessfulRequests = false,
  keyGenerator,
}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: { success: false, message },
  });
}

const loginLimiter = createLimiter({
  limit: 5,
  skipSuccessfulRequests: true, // only failed logins count
  message: "Too many login attempts. Please try again after 15 minutes.",
});

const registerLimiter = createLimiter({
  limit: 5,
  message: "Too many registration attempts. Please try again after 15 minutes.",
});

const resendVerificationLimiter = createLimiter({
  limit: 3,
  message: "Too many verification requests. Please try again after 15 minutes.",
});

const forgotPasswordLimiter = createLimiter({
  limit: 3,
  message:
    "Too many password reset requests. Please try again after 15 minutes.",
});

const resetPasswordLimiter = createLimiter({
  limit: 10,
  message: "Too many attempts. Please try again after 15 minutes.",
});

// Keyed by user id (route is behind isAuthenticated), so a wrong
// "current password" can't be brute-forced from many IPs.
const changePasswordLimiter = createLimiter({
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `user:${req.session.userId}`,
  message:
    "Too many password change attempts. Please try again after 15 minutes.",
});

// Adding members looks up emails, so limit it per user to stop
// someone from probing which addresses are registered.
const addMemberLimiter = createLimiter({
  limit: 20,
  keyGenerator: (req) => `user:${req.session.userId}`,
  message: "Too many attempts to add members. Please try again later.",
});

module.exports = {
  addMemberLimiter,
  loginLimiter,
  registerLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
};
