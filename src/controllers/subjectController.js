const db = require('../config/database');

exports.getSubjects = (req, res) => {
  db.all("CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, subject_name TEXT, class_category TEXT)", [], () => {
    db.all("SELECT * FROM subjects ORDER BY id DESC", [], (err, rows) => {
      res.render('subjects/manage', { subjects: rows || [], user: req.session ? req.session.user : null, error: null });
    });
  });
};

exports.postSubjects = (req, res) => {
  const { subject_name, class_category } = req.body || {};
  if (!subject_name) {
    return res.redirect('/subjects');
  }
  db.run("INSERT INTO subjects (subject_name, class_category) VALUES (?, ?)", [subject_name, class_category || 'General'], () => {
    res.redirect('/subjects');
  });
};
