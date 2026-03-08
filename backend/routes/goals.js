const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("No token");
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.JWT_SECRET).id;
};

// Add Goal
router.post("/add", async (req, res) => {
    try {
        const userId = verifyToken(req);
        const { title, target_amount, deadline } = req.body;
        await pool.query(
            `INSERT INTO saving_goals (user_id, title, target_amount, current_amount, deadline) VALUES ($1, $2, $3, 0, $4)`,
            [userId, title, target_amount, deadline]
        );
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// Update Goal contribution
router.post("/add-funds/:id", async (req, res) => {
    try {
        const userId = verifyToken(req);
        const { amount } = req.body;
        const { id } = req.params;
        await pool.query(
            `UPDATE saving_goals SET current_amount = current_amount + $1 WHERE id=$2 AND user_id=$3`,
            [amount, id, userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// Get Goals
router.get("/list", async (req, res) => {
    try {
        const userId = verifyToken(req);
        const result = await pool.query(
            `SELECT * FROM saving_goals WHERE user_id=$1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// Delete Goal
router.delete("/delete/:id", async (req, res) => {
    try {
        const userId = verifyToken(req);
        const id = req.params.id;
        await pool.query(`DELETE FROM saving_goals WHERE id=$1 AND user_id=$2`, [id, userId]);
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
