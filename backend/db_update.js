require('dotenv').config();
const pool = require('./db');

async function updateDb() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10), ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;");
    console.log("DB Updated");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDb();
