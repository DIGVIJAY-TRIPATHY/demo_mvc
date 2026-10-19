const bcrypt = require("bcryptjs");
const { User } = require("../models/user.model");
const crypto = require("crypto");
const { transporter } = require("../config/mail");
const { generateVerificationToken } = require("../utils/token");
const{env} = require("../config/env");

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email already exists
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

    const verificationUrl =
      `${process.env.APP_BASE_URL}/api/auth/verify-email` +
      `?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: normalizedEmail,
        subject: "Verify your email address",
        text: `Please verify your email using this link: ${verificationUrl}`,
      });
    } catch (error) {
      console.error("Verification email failed:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }

    // Create the user only after email sending succeeds
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    return res.status(201).json({
      success: true,
      message: "Verification email sent and user registered successfully.",
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    // Use the same message for unknown emails and wrong passwords
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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

    // Generate a fresh session ID after successful authentication
    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Unable to create session",
        });
      }

      req.session.userId = user.id;

      // Ensure the session is saved before responding
      req.session.save((error) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Unable to save session",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    userId: req.session.userId,
  });
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to log out",
      });
    }

    res.clearCookie("project_camp.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
}

async function verifyEmail(req, res) {
  try {
    const { token, email } = req.query;

    if (
      typeof token !== "string" ||
      typeof email !== "string" ||
      !token ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification token and email are required",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        email: email.trim().toLowerCase(),
        emailVerificationTokenHash: tokenHash,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired",
      });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    // Return a generic response to avoid revealing account status.
    const successMessage =
      "If an unverified account exists, a verification email will be sent.";

    if (!user || user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    const { token, tokenHash } = generateVerificationToken();

    const verificationUrl =
      `${process.env.APP_BASE_URL}/api/auth/verify-email` +
      `?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send the email before updating the stored token.
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Verify your email address",
      text: `Please verify your email by opening this link: ${verificationUrl}`,
    });

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    return res.status(200).json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Resend verification email failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request right now.",
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    // Use the same response whether the account exists or not.
    const response = {
      success: true,
      message:
        "If an account exists with this email, a password reset link will be sent.",
    };

    if (!user) {
      return res.status(200).json(response);
    }

    const { token, tokenHash } = generateVerificationToken();

    const resetUrl =
      `${process.env.APP_BASE_URL}/api/auth/reset-password` +
      `?token=${token}` +
      `&email=${encodeURIComponent(normalizedEmail)}`;

    await transporter.sendMail({
      from: process.env.APP_BASE_URL,
      to: user.email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetUrl}\nThis link expires in 15 minutes.`,
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you didn't request it, ignore this email.</p>
      `,
    });

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    return res.status(200).json(response);
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
}


async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;

    if (
      typeof email !== "string" ||
      typeof token !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, token, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      !user.passwordResetTokenHash ||
      user.passwordResetTokenHash !== tokenHash ||
      !user.passwordResetExpiresAt ||
      new Date(user.passwordResetExpiresAt).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await user.save();

    // Invalidate existing sessions so the old password cannot
    // continue to be used through an existing login session.
    await sessionStore.destroy
      ? sessionStore.destroy()
      : Promise.resolve();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
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
};
