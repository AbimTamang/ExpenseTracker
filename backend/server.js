const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// AUTH ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);



// 🔒 PROTECTED DASHBOARD ROUTE
app.get("/api/dashboard", (req, res) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // If valid
    res.json({
      success: true,
      message: "Dashboard access granted",
      userId: decoded.id,
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});



// SERVER START
app.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});