require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

(async () => {
  try {
    console.log("Testing email...");
    await sendEmail({
      to: "expensetrackerapp21@gmail.com",
      subject: "Test Email",
      html: "<p>This is a test email</p>"
    });
    console.log("Success!");
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
