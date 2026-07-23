const db = require('../config/database');

exports.listSubjects = (req, res) => {
  db.all("SELECT * FROM subjects ORDER BY subject_name ASC", [], (err, rows) => {
    res.render('subjects/manage', { subjects: rows || [], user: req.session, error: null });
  });
};

exports.addSubject = (req, res) => {
  const { subject_name, subject_code } = req.body;
  db.run("INSERT INTO subjects (subject_name, subject_code) VALUES (?, ?)", [subject_name, subject_code.toUpperCase()], (err) => {
    if (err) {
      db.all("SELECT * FROM subjects ORDER BY subject_name ASC", [], (err2, rows) => {
        return res.render('subjects/manage', { subjects: rows || [], user: req.session, error: 'Subject already exists.' });
      });
    } else {
      res.redirect('/subjects');
    }
  });
};
