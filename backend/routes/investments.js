const express = require("express");
const router = express.Router();
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

// Add investment
router.post("/add", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { title, amount, category } = req.body;
        await pool.query(
            `INSERT INTO investments (user_id, title, amount, category) VALUES ($1, $2, $3, $4)`,
            [userId, title, amount, category]
        );
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get investments
router.get("/list", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            `SELECT * FROM investments WHERE user_id=$1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// Delete investment
router.delete("/delete/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        await pool.query(`DELETE FROM investments WHERE id=$1 AND user_id=$2`, [id, userId]);
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
