const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

// Inline verifyToken since there doesn't seem to be a separate middleware/auth.js yet
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // add user id to req.user exactly as the routes expect
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long, contain at least one uppercase letter, and at least one special character." });
    }

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

/* ================= GOOGLE AUTH ================= */
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub; // Unique Google Identifier

    // Check if user exists
    let userRes = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    let user;

    if (userRes.rows.length === 0) {
      // Create new user with dummy password (since they use Google)
      // Generate a highly secure random password so they can't login via email/pwd unless they reset it
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, 10);

      // We should ideally have a google_id column, but using email is fine for now
      const insertRes = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *",
        [name, email, hashed]
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    await pool.query(
      "UPDATE users SET otp=$1, otp_expires=$2 WHERE email=$3",
      [otp, otpExpires, email]
    );

    // Send Email
    await sendEmail({
      to: email,
      subject: "Your Google Login OTP",
      html: `
        <h2>Login Verification</h2>
        <p>Your OTP for Google Login is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    res.json({ success: true, requiresOtp: true, email: user.email, message: "OTP sent to your email" });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ success: false, message: "Google Authentication Failed" });
  }
});

/* ================= VERIFY GOOGLE OTP ================= */
router.post("/verify-google-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userRes = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND otp=$2 AND otp_expires > NOW()",
      [email, otp]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = userRes.rows[0];

    // Clear OTP
    await pool.query(
      "UPDATE users SET otp=NULL, otp_expires=NULL WHERE email=$1",
      [email]
    );

    // Generate our own JWT token for the session
    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ success: true, token: jwtToken, name: user.name });
  } catch (err) {
    console.error("Verify Google OTP Error:", err);
    res.status(500).json({ success: false, message: "OTP Verification Failed" });
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

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long, contain at least one uppercase letter, and at least one special character." });
    }

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

/* ================= RESET ACCOUNT DATA ================= */
router.post("/reset-data", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Delete all user related data except the user record
    await pool.query("DELETE FROM expenses WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM investments WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM saving_goals WHERE user_id=$1", [userId]);

    res.json({ success: true, message: "Data wiped successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to wipe data" });
  }
});

/* ================= DELETE ACCOUNT ================= */
router.post("/delete-account", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Delete user (cascade should handle related records if set up, otherwise we delete them manually first)
    await pool.query("DELETE FROM expenses WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM investments WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM saving_goals WHERE user_id=$1", [userId]);

    // Finally delete user
    await pool.query("DELETE FROM users WHERE id=$1", [userId]);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete account" });
  }
});

module.exports = router;
