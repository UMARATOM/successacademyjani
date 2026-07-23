const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE students ADD COLUMN session TEXT", () => {});
  db.run("ALTER TABLE students ADD COLUMN date_of_birth DATE", () => {});
  db.run("ALTER TABLE students ADD COLUMN address TEXT", () => {});
  db.run("ALTER TABLE students ADD COLUMN passport_url TEXT", () => {});
  db.run("ALTER TABLE grades ADD COLUMN term TEXT", () => {});
  db.run("ALTER TABLE grades ADD COLUMN session TEXT", () => {});
});

module.exports = db;
