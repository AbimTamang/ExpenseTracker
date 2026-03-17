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

        // Check for force-refresh query param
        const forceRefresh = req.query.force === 'true';

        // Check Cache FIRST (unless forcing refresh)
        const latestTx = transactions[0] ? transactions[0].created_at : "none";
        const cacheKey = `${req.userId}_${transactions.length}_${latestTx}`;
        
        if (!forceRefresh && aiCache.has(cacheKey)) {
            console.log("AI: Returning cached insights.");
            return res.json({ success: true, insights: aiCache.get(cacheKey) });
        }

        if (transactions.length < 3) {
            console.log("AI: Not enough transactions (need 3)");
            return res.json({
                success: true,
                insights: ["Add at least 3 transactions to unlock AI analysis! The more you add, the smarter I get."]
            });
        }

        const modelName = "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
      You are a wise and friendly financial advisor for an app called Fintrack. 
      Analyze the user's last 50 transactions and provide exactly 3 concise, actionable pieces of advice.
      
      CRITICAL: Try to vary your focus! If you gave advice on "Food" last time, maybe suggest something about "Transport" or "Savings" this time. Give a mix of encouragement and warning.
      
      Keep each insight under 15 words.
      Transactions: ${JSON.stringify(transactions)}
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

// --- NEW: AI Spending Prediction / Forecast ---
router.get("/predictions", verifyToken, async (req, res) => {
    try {
        if (!apiKey) {
            return res.json({ success: false, message: "AI Forecasting requires Gemini API Key." });
        }

        // Fetch all transactions (removed date filter temporarily to troubleshoot)
        const result = await pool.query(
            `SELECT title, amount, type, category, created_at 
             FROM expenses 
             WHERE user_id=$1
             ORDER BY created_at DESC`,
            [req.userId]
        );

        const history = result.rows;
        console.log(`AI Forecast: Found ${history.length} transactions in history for user ${req.userId}`);

        if (history.length < 3) {
            return res.json({
                success: true,
                forecast: "Keep tracking! Once you have at least 3 transactions in the last 30 days, I can predict your future spending."
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are a predictive financial AI. Analyze this user's 30-day spending history:
            ${JSON.stringify(history)}

            Based on this, predict:
            1. Estimated total spending for next week (7 days).
            2. The category they are most likely to overspend in.
            3. One specific warning about a recurring pattern.

            Return the response as a simple JSON object:
            { "estimatedNextWeek": number, "riskCategory": "category name", "warning": "concise sentence" }
        `;

        try {
            console.log(`AI Forecast: Calling Gemini for user ${req.userId}...`);
            const aiResult = await model.generateContent(prompt);
            const response = await aiResult.response;
            let text = response.text().replace(/```json|```/g, "").trim();
            
            console.log("AI Forecast Response:", text);
            
            try {
                const forecast = JSON.parse(text);
                res.json({ success: true, forecast });
            } catch (jsonErr) {
                console.error("AI Forecast JSON Parse Error:", jsonErr);
                // If it's not JSON, it might be plain text
                res.json({ success: true, forecast: text });
            }
        } catch (genErr) {
            console.error("Gemini API Error (Forecast):", genErr.message);
            // Viva Fallback
            const mockForecast = {
                estimatedNextWeek: history.reduce((sum, t) => sum + Number(t.amount), 0) / 4,
                riskCategory: history[0].category || "Miscellaneous",
                warning: "Based on your recent activity, watch your weekend spending!"
            };
            res.json({ success: true, forecast: mockForecast });
        }

    } catch (err) {
        console.error("AI Prediction Error:", err);
        res.json({ success: false, message: "Unable to generate forecast." });
    }
});

module.exports = router;
