const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,   // ← changed this
  port: parseInt(process.env.MYSQLPORT)
});

module.exports = db;