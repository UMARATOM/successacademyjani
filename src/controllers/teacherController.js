const db = require('../config/database');

exports.getTeachers = (req, res) => {
  db.all("SELECT * FROM teachers ORDER BY id DESC", [], (err, rows) => {
    res.render('teachers/list', { teachers: rows || [], user: req.session ? req.session.user : null });
  });
};
