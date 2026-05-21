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
    const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
    const response = await axios.post(`${ML_API_URL}/predict`, {
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

    // PostgreSQL numeric type returns strings — convert to actual numbers
    const transactions = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount) || 0
    }));

    res.json({
      success: true,
      transactions
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
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE type='income'
       AND user_id=$1`,
      [userId]
    );

    const expense = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE type='expense'
       AND user_id=$1`,
      [userId]
    );

    const incomeValue = parseFloat(income.rows[0].total) || 0;
    const expenseValue = parseFloat(expense.rows[0].total) || 0;

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

    let pendingDescription = "";

    for (let line of lines) {
      if (!line.trim()) continue;
      
      // Look for dates to remove them from lines
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
      // Skip metadata or summary lines that usually hold totals, balances or interest
      if (/balance|opening|closing|total|summary|interest|tax/i.test(line)) {
        pendingDescription = "";
        continue;
      }

      let lineWithoutDate = line;
      if (dateMatch) {
         lineWithoutDate = line.replace(dateMatch[0], "");
      }
      
      // Try to match amounts. Also don't match percentages (using negative lookahead for %)
      const amountMatch = lineWithoutDate.match(/(?:(?:Rs\.?|NPR|\$|INR)\s*)(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i) 
                          || lineWithoutDate.match(/\b(\d+(?:,\d{3})*\.\d{2})\b(?!\s*%)/)
                          || lineWithoutDate.match(/^\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/);
      
      if (amountMatch) {
        // Find the matched group
        const matchedStr = amountMatch[1] || amountMatch[2] || amountMatch[3];
        if (!matchedStr) continue;

        // remove commas
        const amount = parseFloat(matchedStr.replace(/,/g, ""));
        
        // Sanity checks: amount > 0, amount < 10000000 (1 crore)
        if (amount > 0 && amount < 10000000) {
          // Extract description from the same line if available
          let description = lineWithoutDate.replace(amountMatch[0], "").replace(/[^a-zA-Z\s]/g, " ").replace(/\s\s+/g, ' ').trim();
          
          // If this line only had an amount, fallback to the description from the previous line
          if (description.length < 3 && pendingDescription.length >= 3) {
            description = pendingDescription;
          }
          
          // Require at least a few letters in the description to prevent categorizing empty strings
          if (description.length >= 3) {
            const category = await predictCategory(description);
            categoriesSum[category] = (categoriesSum[category] || 0) + amount;
            totalAmount += amount;
            pendingDescription = ""; // reset after use
          }
        }
      } else {
        // If it's not an amount, maybe it's a description for the next line
        const textOnly = lineWithoutDate.replace(/[^a-zA-Z\s]/g, " ").replace(/\s\s+/g, ' ').trim();
        if (textOnly.length >= 3) {
            pendingDescription = textOnly;
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

/* ======================
   PARSE WALLET STATEMENT (eSewa / Khalti)
   Forwards the PDF to the Python ML service
====================== */

router.post("/parse-wallet-statement", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Forward the file to Python ML service
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
    const response = await axios.post(`${ML_API_URL}/parse_statement`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data.success) {
      res.json({
        success: true,
        transactions: response.data.transactions,
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.message || "Failed to parse statement",
      });
    }
  } catch (err) {
    console.error("Parse wallet statement error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to parse wallet statement",
    });
  }
});

/* ======================
   IMPORT BULK TRANSACTIONS
   Saves multiple parsed transactions at once
====================== */

router.post("/import-bulk", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: "No transactions to import" });
    }

    let imported = 0;
    let skipped = 0;

    for (const t of transactions) {
      const { title, amount, type, category, date } = t;
      if (!title || !amount) continue;

      // Check if a similar transaction already exists to prevent duplicates
      let duplicateCheck;
      if (date) {
        // If a date is provided, match exactly on user, title, amount, and the exact day
        duplicateCheck = await pool.query(
          `SELECT id FROM expenses 
           WHERE user_id = $1 AND title = $2 AND amount = $3 
           AND created_at::date = $4::date`,
          [userId, title, amount, date]
        );
      } else {
        // If no date is available, check if the exact same transaction was added recently (within 30 days)
        duplicateCheck = await pool.query(
          `SELECT id FROM expenses 
           WHERE user_id = $1 AND title = $2 AND amount = $3 
           AND created_at >= NOW() - INTERVAL '30 days'`,
          [userId, title, amount]
        );
      }

      if (duplicateCheck.rows.length > 0) {
        skipped++;
        continue; // Skip this duplicate transaction
      }

      const query = date
        ? `INSERT INTO expenses (user_id, title, amount, type, category, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
        : `INSERT INTO expenses (user_id, title, amount, type, category) VALUES ($1, $2, $3, $4, $5)`;

      const params = date
        ? [userId, title, amount, type || "expense", category || "Other", date]
        : [userId, title, amount, type || "expense", category || "Other"];

      await pool.query(query, params);
      imported++;
    }

    res.json({ success: true, imported, skipped });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({ success: false, message: "Failed to import transactions" });
  }
});

/* ======================
   AI INSIGHTS
====================== */

router.get("/insights", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch expenses for the current month
    const result = await pool.query(
      `SELECT title, amount, category, created_at as date 
       FROM expenses 
       WHERE user_id=$1 AND type='expense' 
       AND created_at >= date_trunc('month', CURRENT_DATE)
       ORDER BY created_at DESC`,
      [userId]
    );

    const transactions = result.rows.map(row => ({
      title: row.title,
      amount: parseFloat(row.amount),
      category: row.category,
      date: new Date(row.date).toISOString().split("T")[0]
    }));

    if (transactions.length === 0) {
      return res.json({
        success: true,
        insights: ["Not enough data for this month to generate insights. Add more expenses!"]
      });
    }

    // Call the Python ML API
    const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
    const response = await axios.post(`${ML_API_URL}/insights`, {
      transactions
    });

    res.json({
      success: true,
      insights: response.data.insights || []
    });

  } catch (err) {
    console.error("AI Insights error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights"
    });
  }
});

module.exports = router;