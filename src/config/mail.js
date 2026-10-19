require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function verifyMailConnection() {
  console.log("--- SMTP Configuration Check ---");
  console.log("SMTP Host:", process.env.SMTP_HOST);
  console.log("SMTP Port:", process.env.SMTP_PORT);
  console.log("SMTP User:", process.env.SMTP_USER);
  console.log("SMTP Password exists:", Boolean(process.env.SMTP_PASSWORD));
  console.log("SMTP Password length:", process.env.SMTP_PASSWORD?.length);

  try {
    await transporter.verify();
    console.log("SMTP connection and authentication successful");
  } catch (error) {
    console.error("SMTP verification failed");
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Error response:", error.response);
  }
}

module.exports = { transporter, verifyMailConnection };
