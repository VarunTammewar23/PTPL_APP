// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// 🔍 TEMP DEBUG — ADD THESE LINES
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD ? "SET" : "MISSING");
console.log("DB_NAME =", process.env.DB_NAME);
// 🔍 END DEBUG

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
