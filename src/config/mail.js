const nodemailer = require("nodemailer");
const { env } = require("./env");

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: {
    user: env.mail.user,
    pass: env.mail.password,
  },
});

async function verifyMailConnection() {
  try {
    await transporter.verify();
    console.log("SMTP connection and authentication successful");
  } catch (error) {
    console.error("SMTP verification failed:", error.code, error.message);
  }
}

module.exports = { transporter, verifyMailConnection };
