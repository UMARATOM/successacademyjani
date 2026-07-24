const db = require('../config/database');

// Helper to ensure teachers table contains all required columns
const fixTeachersTable = (callback) => {
  db.all("PRAGMA table_info(teachers)", [], (err, columns) => {
    const colNames = (columns || []).map(c => c.name);
    
    // If table missing or doesn't have username column, recreate table cleanly
    if (!colNames.includes('username')) {
      db.run("DROP TABLE IF EXISTS teachers", [], () => {
        db.run(`CREATE TABLE teachers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullname TEXT,
          username TEXT UNIQUE,
          password TEXT,
          phone TEXT,
          subject_assigned TEXT,
          role TEXT DEFAULT 'Teacher'
        )`, [], () => callback());
      });
    } else {
      callback();
    }
  });
};

exports.getTeachers = (req, res) => {
  fixTeachersTable(() => {
    db.all("SELECT * FROM teachers ORDER BY id DESC", [], (err, rows) => {
      if (err) console.error("Error fetching teachers:", err);
      res.render('teachers/list', { teachers: rows || [], user: req.session ? req.session.user : null });
    });
  });
};

exports.getRegister = (req, res) => {
  res.render('teachers/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  const { fullname, username, password, phone, subject_assigned } = req.body || {};

  if (!fullname || !username || !password) {
    return res.render('teachers/register', { 
      error: 'Staff Full Name, Username, and Password are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  const cleanUsername = username.trim().toLowerCase();

  if (cleanUsername === 'admin') {
    return res.render('teachers/register', { 
      error: "The username 'admin' is reserved for the Administrator.", 
      user: req.session ? req.session.user : null 
    });
  }

  fixTeachersTable(() => {
    db.run(
      "INSERT INTO teachers (fullname, username, password, phone, subject_assigned, role) VALUES (?, ?, ?, ?, ?, 'Teacher')",
      [fullname.trim(), cleanUsername, password.trim(), phone || '', subject_assigned || 'General'],
      (err) => {
        if (err) {
          console.error("Error creating staff account:", err.message);
          let errorMsg = `Unable to create staff account: ${err.message}`;
          if (err.message && err.message.includes('UNIQUE')) {
            errorMsg = `The username '${cleanUsername}' is already taken. Please choose another username.`;
          }
          return res.render('teachers/register', { 
            error: errorMsg, 
            user: req.session ? req.session.user : null 
          });
        }
        res.redirect('/teachers');
      }
    );
  });
};

exports.getDelete = (req, res) => {
  const teacherId = req.params.id;
  db.run("DELETE FROM teachers WHERE id = ?", [teacherId], () => {
    res.redirect('/teachers');
  });
};
