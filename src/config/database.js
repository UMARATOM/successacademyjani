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
    class_name TEXT,
    gender TEXT,
    dob TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Explicitly add all missing name and detail columns
  const cols = [
    "name", "first_name", "last_name", 
    "registration_number", "guardian_name", 
    "guardian_phone", "passport_path"
  ];

  cols.forEach(col => {
    db.run(`ALTER TABLE students ADD COLUMN ${col} TEXT`, () => {
      // Catch and ignore duplicate column errors quietly
    });
  });
});

module.exports = db;
