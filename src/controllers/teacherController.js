const db = require('../config/database');

exports.getTeachers = (req, res) => {
  db.all("SELECT * FROM teachers", [], (err, rows) => {
    res.render('teachers/list', { teachers: rows || [], user: req.session ? req.session.user : null });
  });
};
exports.getRegister = (req, res) => res.render('teachers/register', { error: null, user: req.session ? req.session.user : null });
exports.postRegister = (req, res) => res.redirect('/teachers');
