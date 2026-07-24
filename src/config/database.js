const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('[DATABASE] Connected to SQLite database');
  }
});

db.serialize(() => {
  // Students Table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT,
    full_name TEXT,
    name TEXT,
    class TEXT,
    class_name TEXT,
    gender TEXT,
    dob TEXT,
    session_year TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    reg_number TEXT,
    registration_number TEXT,
    passport_path TEXT,
    birth_cert TEXT,
    primary_cert TEXT,
    status TEXT
  )`);

  // Teachers Table
  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT,
    username TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    subject_assigned TEXT,
    role TEXT DEFAULT 'Teacher'
  )`);

  // Subjects Table
  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT,
    subject_code TEXT,
    class_category TEXT
  )`);

  // Grades / Continuous Assessment Table
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    term TEXT DEFAULT '1st Term',
    session_year TEXT DEFAULT '2025/2026',
    ca1 REAL DEFAULT 0,
    ca2 REAL DEFAULT 0,
    exam REAL DEFAULT 0,
    total REAL DEFAULT 0,
    grade TEXT,
    remarks TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  )`);
});

module.exports = db;
