const express = require("express");
const router = express.Router();

const pool = require("../db");
const jwt = require("jsonwebtoken");



/* ======================
   VERIFY TOKEN FUNCTION
====================== */

const verifyToken = (req) => {

  const authHeader =
    req.headers.authorization;

  const token =
    authHeader.split(" ")[1];

  const decoded =
    jwt.verify(
      token,
      process.env.JWT_SECRET
    );

  return decoded.id;

};




/* ======================
   ADD TRANSACTION
====================== */

router.post("/add", async (req, res) => {

  try {

    const userId =
      verifyToken(req);

    const {
      title,
      amount,
      type,
      category
    } = req.body;



    await pool.query(

      `INSERT INTO expenses
       (user_id,title,amount,type,category)
       VALUES ($1,$2,$3,$4,$5)`,

      [userId, title, amount, type, category]

    );


    res.json({

      success: true

    });

  }

  catch (err) {

    console.log(err);

  }

});





/* ======================
   GET ALL TRANSACTIONS
====================== */

router.get("/list", async (req, res) => {

  try {

    const userId =
      verifyToken(req);


    const result =
      await pool.query(

        `SELECT *
         FROM expenses
         WHERE user_id=$1
         ORDER BY created_at DESC`,

        [userId]

      );


    res.json({

      success: true,

      transactions:
        result.rows

    });

  }

  catch (err) {

    console.log(err);

  }

});






/* ======================
   SUMMARY
====================== */

router.get("/summary", async (req, res) => {

  try {

    const userId =
      verifyToken(req);



    const income =
      await pool.query(

        `SELECT SUM(amount)
         FROM expenses
         WHERE type='income'
         AND user_id=$1`,

        [userId]

      );



    const expense =
      await pool.query(

        `SELECT SUM(amount)
         FROM expenses
         WHERE type='expense'
         AND user_id=$1`,

        [userId]

      );



    const incomeValue =
      income.rows[0].sum || 0;

    const expenseValue =
      expense.rows[0].sum || 0;



    res.json({

      success: true,

      summary: {

        income: incomeValue,

        expense: expenseValue,

        balance:
          incomeValue - expenseValue

      }

    });

  }

  catch (err) {

    console.log(err);

  }

});







/* ======================
   DELETE
====================== */

router.delete("/delete/:id", async (req, res) => {

  try {

    const userId =
      verifyToken(req);

    const id =
      req.params.id;



    await pool.query(

      `DELETE FROM expenses
       WHERE id=$1
       AND user_id=$2`,

      [id, userId]

    );


    res.json({
      success: true
    });

  }
  catch (err) {
    console.log(err);
  }

});


/* ======================
   EXPORT TO CSV
====================== */

router.get("/export", async (req, res) => {
  try {
    const userId = verifyToken(req);

    const result = await pool.query(
      `SELECT title, amount, type, category, created_at 
       FROM expenses 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No data to export" });
    }

    const fields = ["Title", "Amount", "Type", "Category", "Date"];
    const csvRows = [fields.join(",")];

    for (const row of result.rows) {
      const values = [
        `"${row.title}"`,
        row.amount,
        row.type,
        `"${row.category}"`,
        `"${new Date(row.created_at).toISOString().split('T')[0]}"`
      ];
      csvRows.push(values.join(","));
    }

    const csvData = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ExpenseTracker_Data.csv");
    res.status(200).send(csvData);

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ success: false, message: "Export failed" });
  }
});

module.exports = router;