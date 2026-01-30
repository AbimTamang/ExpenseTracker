const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// SIGNUP
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (user.rows.length > 0)
    return res.status(400).json({ message: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
    [name, email, hashed]
  );

  res.status(201).json({ message: "User created" });
};

// LOGIN
// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // ✅ THIS IS THE LINE YOU ASKED ABOUT
  res.json({
    success: true,
    token,
    name: user.name, // frontend stores this
  });
};

module.exports = { signup, login };
