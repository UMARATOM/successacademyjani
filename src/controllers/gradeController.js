const db = require('../config/database');

exports.getEnterGrades = (req, res) => {
  const selectedSession = req.query.session || '2025/2026';
  const selectedTerm = req.query.term || 'FIRST';
  const selectedClass = req.query.class_name || '';

  db.all("SELECT DISTINCT class_name FROM students WHERE class_name IS NOT NULL", [], (err, classes) => {
    const classList = classes || [];
    if (!selectedClass) {
      return res.render('grades/enter', {
        students: [], classes: classList, selectedSession, selectedTerm, selectedClass, user: req.session ? req.session.user : null
      });
    }
    db.all("SELECT * FROM students WHERE class_name = ?", [selectedClass], (err, students) => {
      res.render('grades/enter', {
        students: students || [], classes: classList, selectedSession, selectedTerm, selectedClass, user: req.session ? req.session.user : null
      });
    });
  });
};

exports.getReportCard = (req, res) => {
  const studentId = req.params.studentId;
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.status(404).send("Student Not Found");
    db.all("SELECT * FROM grades WHERE student_id = ?", [studentId], (err, grades) => {
      res.render('grades/report-card', {
        student, grades: grades || [], session: req.query.session || '2025/2026', term: req.query.term || 'FIRST', user: req.session ? req.session.user : null
      });
    });
  });
};

exports.postEnterGrades = (req, res) => res.redirect('/grades');
