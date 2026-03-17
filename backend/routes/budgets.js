const express = require("express");
const router = express.Router();
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

// Set or Update a budget for a category
router.post("/upsert", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, amount } = req.body;

    const query = `
      INSERT INTO budgets (user_id, category, amount)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, category)
      DO UPDATE SET amount = EXCLUDED.amount
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, category, amount]);

    res.json({ success: true, budget: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all budgets for the user
router.get("/list", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query("SELECT * FROM budgets WHERE user_id = $1", [userId]);
    res.json({ success: true, budgets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get budget vs spending stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Join budgets with expenses to get current spending per category
    // We only look at 'expense' type in the expenses table
    const query = `
      SELECT 
        b.category, 
        b.amount as budget_limit,
        COALESCE(SUM(e.amount), 0) as current_spent
      FROM budgets b
      LEFT JOIN expenses e ON b.user_id = e.user_id 
        AND b.category = e.category 
        AND e.type = 'expense'
        AND e.created_at >= date_trunc('month', CURRENT_DATE)
      WHERE b.user_id = $1
      GROUP BY b.category, b.amount;
    `;
    const result = await pool.query(query, [userId]);

    res.json({ success: true, stats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
