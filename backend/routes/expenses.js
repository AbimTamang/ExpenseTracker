const express = require("express");
const router = express.Router();
const axios = require("axios");

const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");
const sendEmail = require("../utils/sendEmail");

const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

const upload = multer({ storage: multer.memoryStorage() });

async function predictCategory(text) {
  try {
    const response = await axios.post("http://127.0.0.1:8000/predict", {
      text: text
    });
    const category = response.data.category;
    // Model already returns correctly-cased labels (e.g., "Food & Drinks", "Shopping")
    return category;
  } catch (error) {
    console.error("AI prediction error:", error.message);
    return "Other";
  }
}

/* ======================
   ADD TRANSACTION
====================== */

router.post("/add", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    let {
      title,
      amount,
      type,
      category,
      date
    } = req.body;

    if (!category || category.trim() === "") {
      category = await predictCategory(title);
      console.log("Predicted category:", category);
    }

    // -- BUDGET ALERT LOGIC --
    let previousSpent = 0;
    let budgetLimit = null;

    // Check pre-existing budget and spending if it's an expense
    if (type === 'expense') {
      const budgetRes = await pool.query("SELECT amount FROM budgets WHERE user_id=$1 AND category=$2", [userId, category]);
      if (budgetRes.rows.length > 0) {
        budgetLimit = parseFloat(budgetRes.rows[0].amount);
        
        const spentRes = await pool.query(`
          SELECT COALESCE(SUM(amount), 0) as current_spent
          FROM expenses 
          WHERE user_id=$1 AND category=$2 AND type='expense'
          AND created_at >= date_trunc('month', CURRENT_DATE)
        `, [userId, category]);

        previousSpent = parseFloat(spentRes.rows[0].current_spent);
      }
    }

    const query = date
      ? `INSERT INTO expenses (user_id, title, amount, type, category, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
      : `INSERT INTO expenses (user_id, title, amount, type, category) VALUES ($1, $2, $3, $4, $5)`;

    const params = date
      ? [userId, title, amount, type, category, date]
      : [userId, title, amount, type, category];

    await pool.query(query, params);

    // Evaluate budget crossing after insert
    if (budgetLimit && type === 'expense') {
      // Check if the expense belongs to current month to avoid triggering alerts for past entries
      const isCurrentMonth = date 
        ? new Date(date).getMonth() === new Date().getMonth() && new Date(date).getFullYear() === new Date().getFullYear() 
        : true;

      if (isCurrentMonth) {
        const newSpent = previousSpent + parseFloat(amount);
        const threshold = 0.75 * budgetLimit;
        
        // If we crossed 75% for the first time
        if (previousSpent < threshold && newSpent >= threshold) {
          const userRes = await pool.query("SELECT email, name FROM users WHERE id=$1", [userId]);
          if (userRes.rows.length > 0) {
            const { email: userEmail, name: userName } = userRes.rows[0];
            
            await sendEmail({
              to: userEmail,
              subject: `⚠️ Budget Alert: 75% Reached for ${category}`,
              html: `
                <h2>Hi ${userName},</h2>
                <p>You have just reached <strong>75%</strong> of your budget for the <strong>${category}</strong> category!</p>
                <p><strong>Your Monthly Budget:</strong> Rs. ${budgetLimit.toFixed(2)}</p>
                <p><strong>Current Spent:</strong> Rs. ${newSpent.toFixed(2)}</p>
                <br />
                <p>Please review your expenses on the ExpenseTracker Dashboard to ensure you don't exceed your budget this month!</p>
              `,
            }).catch(e => console.log("Failed to send budget alert email", e));
          }
        }
      }
    }

    res.json({
      success: true,
      category
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to add transaction"
    });
  }
});

/* ======================
   GET ALL TRANSACTIONS
====================== */

router.get("/list", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT *
       FROM expenses
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions"
    });
  }
});

/* ======================
   SUMMARY
====================== */

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const income = await pool.query(
      `SELECT SUM(amount)
       FROM expenses
       WHERE type='income'
       AND user_id=$1`,
      [userId]
    );

    const expense = await pool.query(
      `SELECT SUM(amount)
       FROM expenses
       WHERE type='expense'
       AND user_id=$1`,
      [userId]
    );

    const incomeValue = income.rows[0].sum || 0;
    const expenseValue = expense.rows[0].sum || 0;

    res.json({
      success: true,
      summary: {
        income: incomeValue,
        expense: expenseValue,
        balance: incomeValue - expenseValue
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch summary"
    });
  }
});

/* ======================
   DELETE
====================== */

router.delete("/delete/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const id = req.params.id;

    await pool.query(
      `DELETE FROM expenses
       WHERE id=$1
       AND user_id=$2`,
      [id, userId]
    );

    res.json({
      success: true
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction"
    });
  }
});

/* ======================
   EXPORT TO CSV
====================== */

router.get("/export", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT title, amount, type, category, created_at 
       FROM expenses 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data to export"
      });
    }

    const fields = ["Title", "Amount", "Type", "Category", "Date"];
    const csvRows = [fields.join(",")];

    for (const row of result.rows) {
      const values = [
        `"${row.title}"`,
        row.amount,
        row.type,
        `"${row.category}"`,
        `"${new Date(row.created_at).toISOString().split("T")[0]}"`
      ];
      csvRows.push(values.join(","));
    }

    const csvData = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ExpenseTracker_Data.csv");
    res.status(200).send(csvData);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({
      success: false,
      message: "Export failed"
    });
  }
});

/* ======================
   UPLOAD STATEMENT
====================== */

router.post("/upload-statement", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let text = "";
    
    // Check file type
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (req.file.mimetype.startsWith("image/")) {
      const result = await Tesseract.recognize(req.file.buffer, "eng");
      text = result.data.text;
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file type. Use PDF or Image." });
    }

    // Process text: split into lines, extract amounts, predict category
    const lines = text.split("\n");
    const categoriesSum = {};
    let totalAmount = 0;

    for (let line of lines) {
      if (!line.trim()) continue;
      
      // Look for a realistic money amount. Matches 100, 100.00, etc. Avoid matching dates/years unnecesarily.
      // E.g. skip 2024, 2023. We can match Rs. 100 or something. 
      // If we blindly match numbers, we will match dates.
      // Let's match numbers with optional decimal, at least some length or bounded by word boundaries or currency signs.
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
      // Skip metadata or summary lines that usually hold totals and balances
      if (/balance|opening|closing|total|summary/i.test(line)) continue;

      let lineWithoutDate = line;
      if (dateMatch) {
         lineWithoutDate = line.replace(dateMatch[0], "");
      }
      
      // Require either Rs/$/etc or a strict decimal ending
      const amountMatch = lineWithoutDate.match(/(?:(?:Rs\.?|NPR|\$)\s*)(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i) 
                          || lineWithoutDate.match(/\b(\d+(?:,\d{3})*\.\d{2})\b/);
      
      if (amountMatch) {
        // Find the matched group (either index 1 or 2 depending on which side of the OR triggered)
        const matchedStr = amountMatch[1] || amountMatch[2];
        if (!matchedStr) continue;

        // remove commas
        const amount = parseFloat(matchedStr.replace(/,/g, ""));
        
        // Sanity checks: amount > 0, amount < 10000000 (1 crore), so we don't accidentally parse account IDs or phone IDs.
        if (amount > 0 && amount < 10000000) {
          // Remove amount from text to get description
          const description = lineWithoutDate.replace(amountMatch[0], "").replace(/[^a-zA-Z\s]/g, " ").replace(/\s\s+/g, ' ').trim();
          
          // Require at least a few letters in the description to prevent categorizing empty strings
          if (description.length >= 3) {
            const category = await predictCategory(description);
            categoriesSum[category] = (categoriesSum[category] || 0) + amount;
            totalAmount += amount;
          }
        }
      }
    }

    // Calculate percentages
    const percentages = {};
    if (totalAmount > 0) {
      for (const [cat, sum] of Object.entries(categoriesSum)) {
        percentages[cat] = ((sum / totalAmount) * 100).toFixed(2);
      }
    }

    res.json({
      success: true,
      textPreview: text,
      totalAmount,
      categoriesSum,
      percentages
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Failed to process statement: " + err.message });
  }
});

module.exports = router;