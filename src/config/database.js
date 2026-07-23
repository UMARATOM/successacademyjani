const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error connecting to SQLite database:', err);
  else console.log('Connected to SQLite database successfully.');
});

db.serialize(() => {
  // Ensure base students table exists
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    class_name TEXT,
    gender TEXT,
    dob TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Dynamically add all potential missing columns
  const requiredColumns = [
    "ALTER TABLE students ADD COLUMN first_name TEXT",
    "ALTER TABLE students ADD COLUMN last_name TEXT",
    "ALTER TABLE students ADD COLUMN registration_number TEXT",
    "ALTER TABLE students ADD COLUMN guardian_name TEXT",
    "ALTER TABLE students ADD COLUMN guardian_phone TEXT",
    "ALTER TABLE students ADD COLUMN passport_path TEXT"
  ];

  requiredColumns.forEach(sql => {
    db.run(sql, (err) => {
      // Ignore duplicate column errors if column already exists
    });
  });
});

module.exports = db;
