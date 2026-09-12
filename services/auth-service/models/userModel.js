const db = require("../config/db");

const findByEmail = async (email) => {
  const sql = "SELECT id, email, password FROM users WHERE email = ? LIMIT 1";
  const [rows] = await db.execute(sql, [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const sql = "SELECT id, email FROM users WHERE id = ? LIMIT 1";
  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const createUser = async (email, hashedPassword) => {
  const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
  const [result] = await db.execute(sql, [email, hashedPassword]);
  return result.insertId;
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};
