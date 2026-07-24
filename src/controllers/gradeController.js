const db = require('../config/database');

exports.getGradebook = (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    res.render('grades/manage', { students: rows || [], user: req.session ? req.session.user : null });
  });
};
