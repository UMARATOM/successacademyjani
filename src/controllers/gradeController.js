const db = require('../config/database');

exports.getEnterGrades = (req, res) => {
  const selectedSession = req.query.session || '';
  const selectedTerm = req.query.term || '';
  const selectedClass = req.query.class_name || '';

  // Query all active classes for the dropdown menu
  db.all("SELECT DISTINCT class_name FROM students WHERE class_name IS NOT NULL", [], (err, classes) => {
    if (err) {
      console.error("Database error fetching classes:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (!selectedClass) {
      return res.render('grades/enter', {
        students: [],
        classes: classes || [],
        selectedSession,
        selectedTerm,
        selectedClass,
        user: req.session ? req.session.user : null
      });
    }

    // Fetch students belonging to the selected class
    db.all("SELECT * FROM students WHERE class_name = ?", [selectedClass], (err, students) => {
      if (err) {
        console.error("Database error fetching students:", err);
        return res.status(500).send("Internal Server Error");
      }

      res.render('grades/enter', {
        students: students || [],
        classes: classes || [],
        selectedSession,
        selectedTerm,
        selectedClass,
        user: req.session ? req.session.user : null
      });
    });
  });
};
