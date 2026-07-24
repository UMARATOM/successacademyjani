const db = require('../config/database');

// Helper to ensure grades table exists
const fixGradesTable = (callback) => {
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    term TEXT DEFAULT '1st Term',
    session_year TEXT DEFAULT '2025/2026',
    ca1 REAL DEFAULT 0,
    ca2 REAL DEFAULT 0,
    exam REAL DEFAULT 0,
    total REAL DEFAULT 0,
    grade TEXT,
    remarks TEXT
  )`, [], () => callback());
};

// Compute Letter Grade & Remark based on Nigerian Grading System
const calculateGrade = (total) => {
  if (total >= 70) return { grade: 'A', remark: 'EXCELLENT' };
  if (total >= 60) return { grade: 'B', remark: 'VERY GOOD' };
  if (total >= 50) return { grade: 'C', remark: 'CREDIT' };
  if (total >= 45) return { grade: 'D', remark: 'PASS' };
  if (total >= 40) return { grade: 'E', remark: 'FAIR' };
  return { grade: 'F', remark: 'FAIL' };
};

// GET Main Gradebook Interface
exports.getGradebook = (req, res) => {
  const selectedClass = req.query.class_filter || 'JSS 1';
  const selectedSubjectId = req.query.subject_id || '';
  const selectedTerm = req.query.term || '1st Term';
  const selectedSession = req.query.session_year || '2025/2026';

  fixGradesTable(() => {
    // 1. Get Subjects matching the selected class
    let extraCondition = "";
    if (selectedClass.startsWith("JSS")) extraCondition = " OR class_category = 'All JSS Classes'";
    else if (selectedClass.startsWith("Primary")) extraCondition = " OR class_category = 'All Primary Classes'";
    else if (selectedClass.startsWith("Nursery")) extraCondition = " OR class_category = 'All Nursery Classes'";

    const subjectSql = `SELECT * FROM subjects WHERE class_category = ? OR class_category = 'ALL'${extraCondition} ORDER BY subject_name ASC`;
    
    db.all(subjectSql, [selectedClass], (err, subjects) => {
      // 2. Fetch Students in the selected class
      const cleanClass = selectedClass.toLowerCase().replace(/\s+/g, '');
      db.all("SELECT * FROM students ORDER BY id DESC", [], (err, allStudents) => {
        const students = (allStudents || []).filter(s => {
          const sClass = (s.class_name || s.class || s.student_class || '').toString().toLowerCase().replace(/\s+/g, '');
          return sClass.includes(cleanClass);
        });

        if (!selectedSubjectId || subjects.length === 0) {
          return res.render('grades/gradebook', {
            subjects: subjects || [],
            students: students,
            gradesMap: {},
            selectedClass,
            selectedSubjectId,
            selectedTerm,
            selectedSession,
            user: req.session ? req.session.user : null
          });
        }

        // 3. Fetch existing grades for this subject, term, and session
        db.all(
          "SELECT * FROM grades WHERE subject_id = ? AND term = ? AND session_year = ?",
          [selectedSubjectId, selectedTerm, selectedSession],
          (err, gradeRows) => {
            const gradesMap = {};
            (gradeRows || []).forEach(g => {
              gradesMap[g.student_id] = g;
            });

            res.render('grades/gradebook', {
              subjects: subjects || [],
              students: students,
              gradesMap: gradesMap,
              selectedClass,
              selectedSubjectId,
              selectedTerm,
              selectedSession,
              user: req.session ? req.session.user : null
            });
          }
        );
      });
    });
  });
};

// POST Save Assessment Scores Batch
exports.postSaveGrades = (req, res) => {
  const { class_filter, subject_id, term, session_year, ca1, ca2, exam } = req.body || {};

  if (!subject_id) return res.redirect('/grades');

  fixGradesTable(() => {
    const studentIds = Object.keys(ca1 || {});
    const promises = studentIds.map(studentId => {
      return new Promise((resolve) => {
        const score1 = Math.min(20, Math.max(0, parseFloat(ca1[studentId]) || 0));
        const score2 = Math.min(20, Math.max(0, parseFloat(ca2[studentId]) || 0));
        const scoreExam = Math.min(60, Math.max(0, parseFloat(exam[studentId]) || 0));
        const total = score1 + score2 + scoreExam;
        const { grade, remark } = calculateGrade(total);

        db.get(
          "SELECT id FROM grades WHERE student_id = ? AND subject_id = ? AND term = ? AND session_year = ?",
          [studentId, subject_id, term, session_year],
          (err, existing) => {
            if (existing) {
              db.run(
                "UPDATE grades SET ca1 = ?, ca2 = ?, exam = ?, total = ?, grade = ?, remarks = ? WHERE id = ?",
                [score1, score2, scoreExam, total, grade, remark, existing.id],
                () => resolve()
              );
            } else {
              db.run(
                "INSERT INTO grades (student_id, subject_id, term, session_year, ca1, ca2, exam, total, grade, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [studentId, subject_id, term, session_year, score1, score2, scoreExam, total, grade, remark],
                () => resolve()
              );
            }
          }
        );
      });
    });

    Promise.all(promises).then(() => {
      res.redirect(`/grades?class_filter=${encodeURIComponent(class_filter)}&subject_id=${subject_id}&term=${encodeURIComponent(term)}&session_year=${encodeURIComponent(session_year)}`);
    });
  });
};

// GET Official Report Card for Student
exports.getReportCard = (req, res) => {
  const studentId = req.params.studentId;
  const selectedTerm = req.query.term || '1st Term';
  const selectedSession = req.query.session_year || '2025/2026';

  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.redirect('/students');

    // Fetch all grade records for this student for the term
    const sql = `
      SELECT g.*, s.subject_name, s.subject_code 
      FROM grades g 
      JOIN subjects s ON g.subject_id = s.id 
      WHERE g.student_id = ? AND g.term = ? AND g.session_year = ?
    `;

    db.all(sql, [studentId, selectedTerm, selectedSession], (err, gradeRecords) => {
      let grandTotal = 0;
      let subjectCount = (gradeRecords || []).length;

      (gradeRecords || []).forEach(r => {
        grandTotal += (r.total || 0);
      });

      const overallAverage = subjectCount > 0 ? (grandTotal / subjectCount).toFixed(1) : '0.0';

      res.render('grades/report-card', {
        student,
        grades: gradeRecords || [],
        term: selectedTerm,
        session_year: selectedSession,
        grandTotal,
        subjectCount,
        overallAverage,
        user: req.session ? req.session.user : null
      });
    });
  });
};
