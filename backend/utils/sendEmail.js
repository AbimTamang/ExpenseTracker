const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("📡 Creating mail transporter...");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars)
      },
    });

    // This exposes auth errors immediately
    await transporter.verify();
    console.log("✅ Gmail transporter verified");

    const info = await transporter.sendMail({
      from: `"ExpenseTracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
