require("dotenv").config();
const { transporter } = require(".././src/config/mail");

transporter
  .verify()
  .then(() => console.log("SMTP connection successful"))
  .catch((error) => console.error("SMTP error:", error.message));
