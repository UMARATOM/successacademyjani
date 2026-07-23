const db = require('../config/database');

exports.getStudents = (req, res) => {
  db.all("SELECT * FROM students", [], (err, rows) => {
    res.render('students/list', { students: rows || [], user: req.session ? req.session.user : null });
  });
};
exports.getRegister = (req, res) => res.render('students/register', { error: null, user: req.session ? req.session.user : null });
exports.postRegister = (req, res) => res.redirect('/students');
exports.getEdit = (req, res) => res.redirect('/students');
exports.postEdit = (req, res) => res.redirect('/students');
exports.getPrint = (req, res) => res.redirect('/students');
