// db.js — Database connection & schema setup
// Run `node db.js` once to create the table

const mysql = require('mysql2/promise');

// ─── Configure your MySQL credentials here ───────────────────────────────────
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',         // your MySQL username
  password: 'nandini@26_10',  // your MySQL password
  database: 'lbrce_international',
  waitForConnections: true,
  connectionLimit: 10,
};
// ─────────────────────────────────────────────────────────────────────────────

// Connection pool (used by server.js)
const pool = mysql.createPool(DB_CONFIG);

// SQL to create the database + table
const SETUP_SQL = `
  CREATE DATABASE IF NOT EXISTS lbrce_international;
  USE lbrce_international;

  CREATE TABLE IF NOT EXISTS registrations (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    student_id    VARCHAR(50)   NOT NULL UNIQUE,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    phone         VARCHAR(25)   NOT NULL,
    department    VARCHAR(100)  NOT NULL,
    year_of_study VARCHAR(100)   NOT NULL,
    cgpa          DECIMAL(4,2)  DEFAULT NULL,
    target_country VARCHAR(80)  DEFAULT NULL,
    programs      TEXT          NOT NULL,          -- comma-separated chip values
    intake        VARCHAR(30)   DEFAULT NULL,
    goals         TEXT          DEFAULT NULL,
    referral      VARCHAR(60)   DEFAULT NULL,
    registered_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email       (email),
    INDEX idx_department  (department),
    INDEX idx_year        (year_of_study)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// Run this file directly to initialise the DB
async function setupDatabase() {
  // Connect without specifying a database first (to allow CREATE DATABASE)
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    multipleStatements: true,   // needed for running several statements at once
  });

  try {
    console.log('🔧  Running database setup...');
    await tempConn.query(SETUP_SQL);
    console.log('✅  Database "lbrce_international" and table "registrations" are ready.');
  } catch (err) {
    console.error('❌  Setup failed:', err.message);
  } finally {
    await tempConn.end();
  }
}

// If executed directly: node db.js
if (require.main === module) {
  setupDatabase();
}

module.exports = pool;