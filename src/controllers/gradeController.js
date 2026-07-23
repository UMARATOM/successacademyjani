const db = require('../config/database');

function calculateWaecGrade(total) {
  if (total >= 75) return 'A1';
  if (total >= 70) return 'B2';
  if (total >= 65) return 'B3';
  if (total >= 60) return 'C4';
  if (total >= 55) return 'C5';
  if (total >= 50) return 'C6';
  if (total >= 45) return 'D7';
  if (total >= 40) return 'E8';
  return 'F9';
}

exports.showGradebookSelector = (req, res) => {
  const selectedClass = req.query.class || '';
  const selectedSubject = req.query.subject || '';

  db.all("SELECT DISTINCT class FROM students", [], (err, classRows) => {
    const classes = classRows ? classRows.map(c => c.class) : [];

    db.all("SELECT subject_name FROM subjects ORDER BY subject_name ASC", [], (errSub, subjectRows) => {
      const subjects = subjectRows ? subjectRows.map(s => s.subject_name) : [];

      if (selectedClass && selectedSubject) {
        db.all(`
          SELECT s.id, s.reg_number, s.fullname, g.ca_score, g.exam_score, g.total_score, g.grade_letter
          FROM students s
          LEFT JOIN grades g ON s.id = g.student_id AND g.subject_name = ?
          WHERE s.class = ? AND s.status = 'Active'
          ORDER BY s.fullname ASC
        `, [selectedSubject, selectedClass], (err2, students) => {
          res.render('grades/enter', {
            classes, subjects, students: students || [], selectedClass, selectedSubject, user: req.session, message: null
          });
        });
      } else {
        res.render('grades/enter', {
          classes, subjects, students: [], selectedClass, selectedSubject, user: req.session, message: null
        });
      }
    });
  });
};

exports.saveBulkGrades = (req, res) => {
  const { class_name, subject_name, student_ids, ca_scores, exam_scores } = req.body;
  if (!student_ids || student_ids.length === 0) {
    return res.redirect(`/grades?class=${class_name}&subject=${subject_name}`);
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    let hasError = false;

    const ids = Array.isArray(student_ids) ? student_ids : [student_ids];
    const cas = Array.isArray(ca_scores) ? ca_scores : [ca_scores];
    const exams = Array.isArray(exam_scores) ? exam_scores : [exam_scores];

    const stmt = db.prepare(`
      INSERT INTO grades (student_id, subject_name, ca_score, exam_score, total_score, grade_letter)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (student_id, subject_name) DO UPDATE SET
        ca_score = excluded.ca_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        grade_letter = excluded.grade_letter
    `);

    for (let i = 0; i < ids.length; i++) {
      const studentId = ids[i];
      const caVal = parseFloat(cas[i]) || 0;
      const examVal = parseFloat(exams[i]) || 0;
      const totalVal = caVal + examVal;
      const letterGrade = calculateWaecGrade(totalVal);

      stmt.run([studentId, subject_name, caVal, examVal, totalVal, letterGrade], (err) => {
        if (err) hasError = true;
      });
    }

    stmt.finalize();
    if (hasError) {
      db.run("ROLLBACK");
      res.status(500).send("Database transaction error.");
    } else {
      db.run("COMMIT");
      res.redirect(`/grades?class=${class_name}&subject=${subject_name}`);
    }
  });
};

exports.saveRemarks = (req, res) => {
  const { student_id, teacher_comment } = req.body;
  db.run(`
    INSERT INTO report_remarks (student_id, teacher_comment)
    VALUES (?, ?)
    ON CONFLICT (student_id) DO UPDATE SET teacher_comment = excluded.teacher_comment
  `, [student_id, teacher_comment], (err) => {
    if (err) console.error(err);
    res.redirect(`/grades/report-card/${student_id}`);
  });
};

exports.viewStudentReportCard = (req, res) => {
  const studentId = req.params.studentId;
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.status(404).send("Student not found");
    const targetClass = student.class;

    db.get("SELECT COUNT(*) as count FROM students WHERE class = ? AND status = 'Active'", [targetClass], (errCount, rowCount) => {
      const classSize = rowCount ? rowCount.count : 1;

      db.all("SELECT * FROM grades WHERE student_id = ?", [studentId], (errGrades, grades) => {
        const totalScore = grades ? grades.reduce((acc, curr) => acc + curr.total_score, 0) : 0;

        db.all(`
          SELECT student_id, SUM(total_score) as sum_total
          FROM grades
          WHERE student_id IN (SELECT id FROM students WHERE class = ? AND status = 'Active')
          GROUP BY student_id
          ORDER BY sum_total DESC
        `, [targetClass], (errRank, rankRows) => {
          let position = 'N/A';
          if (rankRows && rankRows.length > 0) {
            const rankIndex = rankRows.findIndex(r => r.student_id === parseInt(studentId));
            if (rankIndex !== -1) {
              const rawPosition = rankIndex + 1;
              const j = rawPosition % 10, k = rawPosition % 100;
              if (j == 1 && k != 11) position = rawPosition + "st";
              else if (j == 2 && k != 12) position = rawPosition + "nd";
              else if (j == 3 && k != 13) position = rawPosition + "rd";
              else position = rawPosition + "th";
            }
          }

          db.get("SELECT teacher_comment FROM report_remarks WHERE student_id = ?", [studentId], (errRem, remarkRow) => {
            const remark = remarkRow ? remarkRow.teacher_comment : '';
            res.render('grades/report-card', {
              student, grades: grades || [], classSize, totalScore, position, remark, user: req.session
            });
          });
        });
      });
    });
  });
};
