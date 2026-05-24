const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const investmentRoutes = require("./routes/investments");
const goalRoutes = require("./routes/goals");

const budgetRoutes = require("./routes/budgets");


const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Required for Chrome's Private Network Access policy
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(express.json());



// AUTH ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/goals", goalRoutes);

app.use("/api/budgets", budgetRoutes);



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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});