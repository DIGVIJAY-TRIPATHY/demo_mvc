const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isString = (v) => typeof v === "string";

function fail(res, errors) {
  return res
    .status(400)
    .json({ success: false, message: "Validation failed", errors });
}

function checkEmail(value, errors) {
  if (!isString(value) || !value.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (value.trim().length > 255 || !EMAIL_RE.test(value.trim())) {
    errors.push({ field: "email", message: "Enter a valid email address" });
  }
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!isString(name) || !name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (name.trim().length > 100) {
    errors.push({
      field: "name",
      message: "Name must be at most 100 characters",
    });
  }

  checkEmail(email, errors);

  if (!isString(password) || password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters",
    });
  } else if (Buffer.byteLength(password, "utf8") > 72) {
    // bcrypt silently ignores everything after 72 bytes
    errors.push({
      field: "password",
      message: "Password must be at most 72 bytes",
    });
  }

  return errors.length ? fail(res, errors) : next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  checkEmail(email, errors);
  if (!isString(password) || !password || password.length > 1024) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return errors.length ? fail(res, errors) : next();
}

function validateEmailBody(req, res, next) {
  const errors = [];
  checkEmail((req.body || {}).email, errors);
  return errors.length ? fail(res, errors) : next();
}

function validateVerifyEmailQuery(req, res, next) {
  const { token, email } = req.query;
  const errors = [];

  if (!isString(token) || !/^[a-f0-9]{64}$/.test(token)) {
    errors.push({ field: "token", message: "Invalid verification token" });
  }
  checkEmail(email, errors);

  return errors.length ? fail(res, errors) : next();
}

function checkNewPassword(value, errors, field = "newPassword") {
  if (!isString(value) || value.length < 8) {
    errors.push({ field, message: "Password must be at least 8 characters" });
  } else if (Buffer.byteLength(value, "utf8") > 72) {
    // bcrypt silently ignores everything after 72 bytes
    errors.push({ field, message: "Password must be at most 72 bytes" });
  }
}

function validateResetPassword(req, res, next) {
  const { token, email, newPassword, confirmPassword } = req.body || {};
  const errors = [];

  if (!isString(token) || !/^[a-f0-9]{64}$/.test(token)) {
    errors.push({ field: "token", message: "Invalid reset token" });
  }
  checkEmail(email, errors);

  checkNewPassword(newPassword, errors);

  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  return errors.length ? fail(res, errors) : next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  const errors = [];

  if (
    !isString(currentPassword) ||
    !currentPassword ||
    currentPassword.length > 1024
  ) {
    errors.push({
      field: "currentPassword",
      message: "Current password is required",
    });
  }

  checkNewPassword(newPassword, errors);

  if (isString(currentPassword) && currentPassword === newPassword) {
    errors.push({
      field: "newPassword",
      message: "New password must be different from the current password",
    });
  }

  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  return errors.length ? fail(res, errors) : next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateEmailBody,
  validateVerifyEmailQuery,
  validateResetPassword,
  validateChangePassword,
};
