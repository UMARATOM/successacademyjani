const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;

let dbWrapper;

if (connectionString) {
  // Only require 'pg' on Render where PostgreSQL is used
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  pool.on('connect', () => {
    console.log('[DATABASE] Connected to Cloud PostgreSQL');
  });

  const convertQuery = (text) => {
    let index = 1;
    return text.replace(/\?/g, () => `$${index++}`);
  };

  dbWrapper = {
    type: 'pg',
    query: (text, params, callback) => {
      if (typeof params === 'function') { callback = params; params = []; }
      pool.query(convertQuery(text), params || [], callback);
    },
    all: (text, params, callback) => {
      if (typeof params === 'function') { callback = params; params = []; }
      pool.query(convertQuery(text), params || [], (err, res) => {
        if (callback) callback(err, res ? res.rows : []);
      });
    },
    get: (text, params, callback) => {
      if (typeof params === 'function') { callback = params; params = []; }
      pool.query(convertQuery(text), params || [], (err, res) => {
        if (callback) callback(err, res && res.rows.length > 0 ? res.rows[0] : null);
      });
    },
    run: (text, params, callback) => {
      if (typeof params === 'function') { callback = params; params = []; }
      pool.query(convertQuery(text), params || [], (err, res) => {
        if (callback) callback(err, res);
      });
    }
  };

  // Create PostgreSQL Tables
  pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      fullname TEXT, full_name TEXT, name TEXT, class TEXT, class_name TEXT,
      gender TEXT, dob TEXT, session_year TEXT, guardian_name TEXT,
      guardian_phone TEXT, reg_number TEXT, registration_number TEXT,
      passport_path TEXT, birth_cert TEXT, primary_cert TEXT, status TEXT
    )
  `);

  pool.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      fullname TEXT, username TEXT UNIQUE, password TEXT, phone TEXT,
      subject_assigned TEXT, role TEXT DEFAULT 'Teacher'
    )
  `);

  pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      subject_name TEXT, subject_code TEXT, class_category TEXT
    )
  `);

  pool.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY,
      student_id INTEGER, subject_id INTEGER, term TEXT DEFAULT '1st Term',
      session_year TEXT DEFAULT '2025/2026', ca1 REAL DEFAULT 0, ca2 REAL DEFAULT 0,
      exam REAL DEFAULT 0, total REAL DEFAULT 0, grade TEXT, remarks TEXT
    )
  `);

} else {
  console.log('[DATABASE] Using local SQLite database');
  
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'database.sqlite');
  const sqliteDb = new sqlite3.Database(dbPath);

  // Initialize SQLite Tables
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT, full_name TEXT, name TEXT, class TEXT, class_name TEXT,
        gender TEXT, dob TEXT, session_year TEXT, guardian_name TEXT,
        guardian_phone TEXT, reg_number TEXT, registration_number TEXT,
        passport_path TEXT, birth_cert TEXT, primary_cert TEXT, status TEXT
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT, username TEXT UNIQUE, password TEXT, phone TEXT,
        subject_assigned TEXT, role TEXT DEFAULT 'Teacher'
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_name TEXT, subject_code TEXT, class_category TEXT
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER, subject_id INTEGER, term TEXT DEFAULT '1st Term',
        session_year TEXT DEFAULT '2025/2026', ca1 REAL DEFAULT 0, ca2 REAL DEFAULT 0,
        exam REAL DEFAULT 0, total REAL DEFAULT 0, grade TEXT, remarks TEXT
      )
    `);
  });

  dbWrapper = sqliteDb;
}

module.exports = dbWrapper;
