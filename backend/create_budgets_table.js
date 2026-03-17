require("dotenv").config();
const pool = require("./db");

const createBudgetsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        UNIQUE(user_id, category)
      );
    `);
    console.log("Budgets table created successfully");
  } catch (error) {
    console.error("Error creating budgets table:", error);
  } finally {
    pool.end();
  }
};

createBudgetsTable();
