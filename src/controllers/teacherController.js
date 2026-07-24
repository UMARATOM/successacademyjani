const db = require('../config/database');

exports.getTeachers = (req, res) => {
  db.all("SELECT * FROM teachers ORDER BY id DESC", [], (err, rows) => {
    if (err) console.error("Error fetching teachers:", err);
    res.render('teachers/list', { teachers: rows || [], user: req.session ? req.session.user : null });
  });
};

exports.getRegister = (req, res) => {
  res.render('teachers/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  const { fullname, username, password, phone, subject_assigned } = req.body || {};

  if (!fullname || !username || !password) {
    return res.render('teachers/register', { 
      error: 'Full Name, Username, and Password are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  const cleanUsername = username.trim().toLowerCase();

  db.run(
    "INSERT INTO teachers (fullname, username, password, phone, subject_assigned, role) VALUES (?, ?, ?, ?, ?, 'Teacher')",
    [fullname.trim(), cleanUsername, password.trim(), phone || '', subject_assigned || 'General'],
    (err) => {
      if (err) {
        console.error("Error creating staff account:", err);
        return res.render('teachers/register', { 
          error: 'Username already exists. Please choose a different username.', 
          user: req.session ? req.session.user : null 
        });
      }
      res.redirect('/teachers');
    }
  );
};

exports.getDelete = (req, res) => {
  const teacherId = req.params.id;
  db.run("DELETE FROM teachers WHERE id = ?", [teacherId], () => {
    res.redirect('/teachers');
  });
};
