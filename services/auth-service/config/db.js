const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false
  }
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("[Auth Service] Connected to MySQL database successfully");
    conn.release();
  } catch (err) {
    console.error("[Auth Service] Error connecting to database:", err.message);
  }
};

testConnection();

module.exports = pool;
