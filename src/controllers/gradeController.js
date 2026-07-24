const db = require('../config/database');

exports.getReportCard = (req, res) => {
  const studentId = req.params.id || req.params.student_id;
  const term = req.query.term || '1st Term';
  const session = req.query.session || '2025/2026';

  // 1. Fetch Student Info
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) {
      console.error("Error fetching student for report card:", err);
      return res.redirect('/students');
    }

    // 2. Count total students in same class for class position calculation
    db.all("SELECT id FROM students WHERE class = ? OR class_name = ?", [student.class, student.class], (err, classStudents) => {
      const classCount = classStudents ? classStudents.length : 1;

      // 3. Fetch Grades with Subject Names
      const sql = `
        SELECT g.*, s.subject_name, s.subject_code 
        FROM grades g
        JOIN subjects s ON g.subject_id = s.id
        WHERE g.student_id = ? AND g.term = ? AND g.session_year = ?
        ORDER BY s.subject_name ASC
      `;

      db.all(sql, [studentId, term, session], (err, grades) => {
        if (err) console.error("Error fetching grades:", err);

        let safeGrades = grades || [];
        let grandTotal = 0;

        safeGrades.forEach(g => {
          const ca1 = parseFloat(g.ca1) || 0;
          const ca2 = parseFloat(g.ca2) || 0;
          const exam = parseFloat(g.exam) || 0;
          g.total_score = ca1 + ca2 + exam;
          grandTotal += g.total_score;
        });

        const overallAverage = safeGrades.length > 0 ? (grandTotal / safeGrades.length).toFixed(1) : "0.0";

        res.render('grades/report_card', {
          student: student,
          grades: safeGrades,
          term: term,
          session: session,
          classCount: classCount,
          grandTotal: grandTotal,
          overallAverage: overallAverage,
          user: req.session ? req.session.user : null
        });
      });
    });
  });
};
