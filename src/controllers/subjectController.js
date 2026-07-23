const db = require('../config/database');

exports.getSubjects = (req, res) => {
  db.all("SELECT * FROM subjects", [], (err, rows) => {
    res.render('subjects/manage', { subjects: rows || [], user: req.session ? req.session.user : null, error: null });
  });
};
exports.postSubjects = (req, res) => res.redirect('/subjects');
