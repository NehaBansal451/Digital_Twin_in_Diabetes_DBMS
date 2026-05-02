const mysql = require('mysql2/promise');

const db = mysql.createPool({
  uri: process.env.MYSQL_URL
});

module.exports = db;