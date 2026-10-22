const { transporter } = require("../config/mail");
const { env } = require("../config/env");

function buildUrl(path, token, email) {
  const url = new URL(path, env.appBaseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
}

async function sendVerificationEmail(to, token) {
  const url = buildUrl("/verify-email", token, to);

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: "Verify your email address",
    text: `Please verify your email by opening this link: ${url}\n\nThe link expires in 60 minutes.`,
    html: `<p>Please verify your email by clicking the link below:</p>
<p><a href="${url}">Verify email</a></p>
<p>The link expires in 60 minutes.</p>`,
  });
}

// The link points to the (future) EJS page /reset-password, which will show
// the "new password" form and POST to /api/auth/reset-password.
// While testing in Postman, copy `token` and `email` from the link.
async function sendPasswordResetEmail(to, token) {
  const url = buildUrl("/reset-password", token, to);

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: "Reset your password",
    text: `We received a request to reset your password. Open this link to choose a new one: ${url}\n\nThe link expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p>
<p><a href="${url}">Choose a new password</a></p>
<p>The link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

async function sendPasswordChangedEmail(to) {
  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: "Your password was changed",
    text: "Your Project Camp password was just changed. If this was not you, reset your password immediately.",
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
