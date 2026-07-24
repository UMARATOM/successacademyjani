const db = require('../config/database');

exports.getDashboard = (req, res) => {
  db.get("SELECT COUNT(*) AS studentCount FROM students", [], (err, sRow) => {
    const studentCount = (sRow && sRow.studentCount) ? sRow.studentCount : 0;
    db.get("SELECT COUNT(*) AS teacherCount FROM teachers", [], (err2, tRow) => {
      const teacherCount = (tRow && tRow.teacherCount) ? tRow.teacherCount : 0;
      res.render('dashboard', { 
        studentCount, 
        teacherCount, 
        user: req.session ? req.session.user : null 
      });
    });
  });
};
