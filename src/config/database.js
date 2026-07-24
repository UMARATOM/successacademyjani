const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  // Use Cloud PostgreSQL Database (Permanent Data Storage)
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  pool.on('connect', () => {
    console.log('[DATABASE] Connected to Cloud PostgreSQL');
  });

  const initPgDb = async () => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        fullname TEXT, full_name TEXT, name TEXT, class TEXT, class_name TEXT,
        gender TEXT, dob TEXT, session_year TEXT, guardian_name TEXT,
        guardian_phone TEXT, reg_number TEXT, registration_number TEXT,
        passport_path TEXT, birth_cert TEXT, primary_cert TEXT, status TEXT
      )`);

      await pool.query(`CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        fullname TEXT, username TEXT UNIQUE, password TEXT, phone TEXT,
        subject_assigned TEXT, role TEXT DEFAULT 'Teacher'
      )`);

      await pool.query(`CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        subject_name TEXT, subject_code TEXT, class_category TEXT
      )`);

      await pool.query(`CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        student_id INTEGER, subject_id INTEGER, term TEXT DEFAULT '1st Term',
        session_year TEXT DEFAULT '2025/2026', ca1 REAL DEFAULT 0, ca2 REAL DEFAULT 0,
        exam REAL DEFAULT 0, total REAL DEFAULT 0, grade TEXT, remarks TEXT
      )`);

      console.log('[DATABASE] Cloud PostgreSQL tables verified');
    } catch (err) {
      console.error('[DATABASE] PostgreSQL Init Error:', err.message);
    }
  };

  initPgDb();

  module.exports = {
    query: (text, params, callback) => pool.query(text, params, callback),
    all: (text, params, callback) => {
      pool.query(text, params, (err, res) => {
        callback(err, res ? res.rows : []);
      });
    },
    get: (text, params, callback) => {
      pool.query(text, params, (err, res) => {
        callback(err, res && res.rows.length > 0 ? res.rows[0] : null);
      });
    },
    run: (text, params, callback) => {
      pool.query(text, params, (err, res) => {
        if (callback) callback(err, res);
      });
    }
  };

} else {
  // Fallback for Local Development Only
  console.log('[DATABASE] Using local SQLite fallback');
  const dbPath = path.join(__dirname, '../../data', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  module.exports = db;
}
