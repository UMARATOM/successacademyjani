const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DATABASE] Connection failed:', err.message);
  } else {
    console.log('[DATABASE] Connected successfully to SQLite database.');
  }
});

initializeDatabase();

function initializeDatabase() {
  db.serialize(() => {
    // Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student'))
      )
    `, [], () => {
      db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
        if (row && row.count === 0) {
          db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')");
        }
      });
    });

    // Students Table (Includes DOB and Parent Info)
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reg_number TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        class TEXT NOT NULL,
        gender TEXT NOT NULL,
        dob TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        passport_path TEXT,
        birth_cert_path TEXT,
        primary_cert_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teachers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        gender TEXT NOT NULL,
        qualification TEXT NOT NULL,
        subject_specialty TEXT NOT NULL,
        user_id INTEGER UNIQUE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Subjects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_name TEXT UNIQUE NOT NULL,
        subject_code TEXT UNIQUE NOT NULL
      )
    `, [], () => {
      db.get("SELECT COUNT(*) as count FROM subjects", [], (err, row) => {
        if (row && row.count === 0) {
          const defaultSubjects = [
            ['Mathematics', 'MTH'],
            ['English Language', 'ENG'],
            ['Basic Science', 'BSC'],
            ['Civic Education', 'CIV']
          ];
          const stmt = db.prepare("INSERT INTO subjects (subject_name, subject_code) VALUES (?, ?)");
          defaultSubjects.forEach(s => stmt.run(s));
          stmt.finalize();
        }
      });
    });

    // Grades Table
    db.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        ca_score REAL DEFAULT 0,
        exam_score REAL DEFAULT 0,
        total_score REAL DEFAULT 0,
        grade_letter TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        UNIQUE (student_id, subject_name)
      )
    `);

    // Teacher Comments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS report_remarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE NOT NULL,
        teacher_comment TEXT DEFAULT '',
        principal_comment TEXT DEFAULT '',
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
      )
    `);
  });
}

module.exports = db;
