const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure persistent data directory exists on Render or local
const dataDir = process.env.RENDER ? path.join('/opt/render/project/src', 'data') : path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('[DATABASE] Connected to persistent SQLite database at:', dbPath);
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

  // Safe migration for teachers columns
  db.all("PRAGMA table_info(teachers)", [], (err, cols) => {
    const colNames = (cols || []).map(c => c.name);
    if (!colNames.includes('username')) {
      db.run("ALTER TABLE teachers ADD COLUMN username TEXT");
    }
    if (!colNames.includes('password')) {
      db.run("ALTER TABLE teachers ADD COLUMN password TEXT");
    }
  });

  // Subjects Table
  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT,
    subject_code TEXT,
    class_category TEXT
  )`);

  // Safe migration for subjects columns
  db.all("PRAGMA table_info(subjects)", [], (err, cols) => {
    const colNames = (cols || []).map(c => c.name);
    if (!colNames.includes('class_category')) {
      db.run("ALTER TABLE subjects ADD COLUMN class_category TEXT");
    }
  });

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

  // Safe migration for grades columns
  db.all("PRAGMA table_info(grades)", [], (err, cols) => {
    const colNames = (cols || []).map(c => c.name);
    if (!colNames.includes('subject_id')) {
      db.run("ALTER TABLE grades ADD COLUMN subject_id INTEGER");
    }
  });
});

module.exports = db;
