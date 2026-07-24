const db = require('../config/database');

exports.getTeachers = (req, res) => {
  db.all("CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, fullname TEXT, username TEXT UNIQUE, password TEXT, phone TEXT, subject_assigned TEXT, role TEXT DEFAULT 'Teacher')", [], () => {
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

  // Block reserving 'admin' for staff
  if (cleanUsername === 'admin') {
    return res.render('teachers/register', { 
      error: "The username 'admin' is reserved for the Administrator. Please use a teacher username like 'kabir' or 'teacher1'.", 
      user: req.session ? req.session.user : null 
    });
  }

  db.run("CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, fullname TEXT, username TEXT UNIQUE, password TEXT, phone TEXT, subject_assigned TEXT, role TEXT DEFAULT 'Teacher')", [], () => {
    db.run(
      "INSERT INTO teachers (fullname, username, password, phone, subject_assigned, role) VALUES (?, ?, ?, ?, ?, 'Teacher')",
      [fullname.trim(), cleanUsername, password.trim(), phone || '', subject_assigned || 'General'],
      (err) => {
        if (err) {
          console.error("Error creating staff account:", err);
          return res.render('teachers/register', { 
            error: `Username '${cleanUsername}' already exists. Please choose a different username.`, 
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
