require('dotenv').config();
const pool = require('./db');

async function updateDb() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(10), 
      ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS weekly_summaries BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS goal_alerts BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS new_login_alerts BOOLEAN DEFAULT false;
    `);
    console.log("DB Updated");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDb();
