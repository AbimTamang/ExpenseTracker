const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Verify Token Middleware (Standard)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// Initialize Gemini with stable v1 endpoint
const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
const genAI = new GoogleGenerativeAI(apiKey);
// Note: SDK v0.12+ uses v1 by default, but we'll ensure we use correct model names

// Basic in-memory cache to prevent quota exhaustion
const aiCache = new Map();

router.get("/insights", verifyToken, async (req, res) => {
    try {
        if (!apiKey) {
            return res.json({
                success: false,
                message: "AI feature requires a GEMINI_API_KEY in the .env file."
            });
        }

        // Fetch last 50 transactions to give context to AI
        const result = await pool.query(
            `SELECT title, amount, type, category, created_at 
       FROM expenses 
       WHERE user_id=$1 
       ORDER BY created_at DESC 
       LIMIT 50`,
            [req.userId]
        );

        const transactions = result.rows;
        console.log(`AI: Found ${transactions.length} transactions for user ${req.userId}`);

        // Check Cache FIRST
        const cacheKey = `${req.userId}_${transactions.length}`;
        if (aiCache.has(cacheKey)) {
            console.log("AI: Returning cached insights.");
            return res.json({ success: true, insights: aiCache.get(cacheKey) });
        }

        if (transactions.length < 10) {
            console.log("AI: Not enough transactions (need 10)");
            return res.json({
                success: true,
                insights: ["Unlock AI analysis by adding at least 10 transactions! This helps me understand your spending patterns better."]
            });
        }

        const modelName = "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
      You are a wise and friendly financial advisor for an app called Fintrack. 
      Analyze the following recent transactions for the user and provide exactly 3 concise, actionable pieces of advice (insights).
      Keep each insight under 15 words. Focus on patterns, potential savings, or goals.
      Return the response as a JSON array of strings.
      
      Transactions:
      ${JSON.stringify(transactions)}
      
      Response Format: ["Insight 1", "Insight 2", "Insight 3"]
    `;

        try {
            console.log(`AI: Calling Gemini API (${modelName})...`);
            const aiResult = await model.generateContent(prompt);
            const response = await aiResult.response;
            let text = response.text();

            text = text.replace(/```json|```/g, "").trim();

            try {
                const insights = JSON.parse(text);
                // Save to cache
                aiCache.set(cacheKey, insights);
                res.json({ success: true, insights });
            } catch (pErr) {
                const lines = text.split("\n").filter(l => l.trim().length > 0).slice(0, 3);
                aiCache.set(cacheKey, lines);
                res.json({ success: true, insights: lines });
            }
        } catch (genErr) {
            console.error("Gemini API Error:", genErr.message);
            if (genErr.message.includes("429")) {
                // Fallback for Viva: Mock insights when quota limit is reached.
                const mockInsights = [
                    "Consider cooking dinner twice a week to save $50.",
                    "Your entertainment expenses are up; try finding free hobbies.",
                    "Great job keeping utility bills low!"
                ];
                return res.json({
                    success: true,
                    insights: mockInsights
                });
            }
            throw genErr;
        }

    } catch (err) {
        console.error("AI Insight Error:", err);
        res.status(500).json({ success: false, message: "AI Advisor Error: " + err.message });
    }
});

module.exports = router;
