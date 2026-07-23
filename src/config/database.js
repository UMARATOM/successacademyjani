const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error connecting to SQLite database:', err);
  else console.log('Connected to SQLite database successfully.');
});

db.serialize(() => {
  // Create base students table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    class_name TEXT,
    gender TEXT,
    dob TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Safely alter table to add missing columns if they don't exist
  const alterColumns = [
    "ALTER TABLE students ADD COLUMN registration_number TEXT",
    "ALTER TABLE students ADD COLUMN guardian_name TEXT",
    "ALTER TABLE students ADD COLUMN guardian_phone TEXT"
  ];

  alterColumns.forEach(sql => {
    db.run(sql, (err) => {
      // Ignore 'duplicate column name' errors if column already exists
    });
  });
});

module.exports = db;
