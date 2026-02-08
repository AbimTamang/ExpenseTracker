const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hashed]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: "Email already exists" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRes = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!userRes.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ success: true, token, name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("FORGOT PASSWORD:", email);

    const userRes = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    // Silent success (security)
    if (!userRes.rows.length) {
      console.log("❌ Email not found");
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.query(
      `UPDATE users
       SET reset_token=$1, reset_token_expires=$2
       WHERE email=$3`,
      [token, expires, email]
    );

    console.log("✅ Reset token saved");

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    console.log("🔗 Reset link:", resetLink);

    await sendEmail({
      to: email,
      subject: "Reset your ExpenseTracker password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    console.log("✅ Reset email sent");
    res.json({ success: true });
  } catch (err) {
    console.error("🔥 Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const userRes = await pool.query(
      `SELECT id FROM users
       WHERE reset_token=$1 AND reset_token_expires > NOW()`,
      [token]
    );

    if (!userRes.rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET password=$1,
           reset_token=NULL,
           reset_token_expires=NULL
       WHERE id=$2`,
      [hashed, userRes.rows[0].id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
