const db = require('../config/database');

const fixGradesTable = (callback) => {
  db.all("PRAGMA table_info(grades)", [], (err, columns) => {
    const colNames = (columns || []).map(c => c.name);
    if (!colNames.includes('subject_id')) {
      db.run("DROP TABLE IF EXISTS grades", [], () => {
        db.run(`CREATE TABLE grades (
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
      });
    } else {
      callback();
    }
  });
};

const calculateGrade = (total) => {
  if (total >= 70) return { grade: 'A', remark: 'EXCELLENT' };
  if (total >= 60) return { grade: 'B', remark: 'VERY GOOD' };
  if (total >= 50) return { grade: 'C', remark: 'CREDIT' };
  if (total >= 45) return { grade: 'D', remark: 'PASS' };
  if (total >= 40) return { grade: 'E', remark: 'FAIR' };
  return { grade: 'F', remark: 'FAIL' };
};

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

exports.getGradebook = (req, res) => {
  const selectedClass = req.query.class_filter || 'JSS 1';
  const selectedSubjectId = req.query.subject_id || '';
  const selectedTerm = req.query.term || '1st Term';
  const selectedSession = req.query.session_year || '2025/2026';

  fixGradesTable(() => {
    db.all("SELECT * FROM subjects ORDER BY subject_name ASC", [], (err, allSubjects) => {
      const subjects = (allSubjects || []).filter(sub => {
        const cat = (sub.class_category || 'ALL').toString();
        if (cat === 'ALL' || cat === selectedClass) return true;
        if (selectedClass.startsWith('JSS') && cat === 'All JSS Classes') return true;
        if (selectedClass.startsWith('Primary') && cat === 'All Primary Classes') return true;
        if (selectedClass.startsWith('Nursery') && cat === 'All Nursery Classes') return true;
        return false;
      });

      db.all("SELECT * FROM students ORDER BY id DESC", [], (err, allStudents) => {
        const cleanClass = selectedClass.toLowerCase().replace(/\s+/g, '');
        const students = (allStudents || []).filter(s => {
          const sClass = (s.class_name || s.class || s.student_class || '').toString().toLowerCase().replace(/\s+/g, '');
          return sClass.includes(cleanClass);
        });

        if (!selectedSubjectId || subjects.length === 0) {
          return res.render('grades/gradebook', {
            subjects: subjects || [],
            students: students || [],
            gradesMap: {},
            selectedClass,
            selectedSubjectId,
            selectedTerm,
            selectedSession,
            user: req.session ? req.session.user : null
          });
        }

        db.all(
          "SELECT * FROM grades WHERE CAST(subject_id AS TEXT) = ? AND term = ? AND session_year = ?",
          [String(selectedSubjectId), selectedTerm, selectedSession],
          (err, gradeRows) => {
            const gradesMap = {};
            (gradeRows || []).forEach(g => {
              gradesMap[g.student_id] = g;
            });

            res.render('grades/gradebook', {
              subjects: subjects || [],
              students: students || [],
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

exports.postSaveGrades = (req, res) => {
  const body = req.body || {};
  const { class_filter, subject_id, term, session_year } = body;

  let rawStudentIds = body.student_ids || [];
  if (!Array.isArray(rawStudentIds)) {
    rawStudentIds = [rawStudentIds];
  }

  const cleanSubjectId = parseInt(subject_id, 10);

  if (!cleanSubjectId || rawStudentIds.length === 0) {
    return res.redirect('/grades');
  }

  fixGradesTable(() => {
    const promises = rawStudentIds.map(sId => {
      return new Promise((resolve) => {
        const studentId = parseInt(sId, 10);
        const score1 = Math.min(20, Math.max(0, parseFloat(body[`ca1_${sId}`]) || 0));
        const score2 = Math.min(20, Math.max(0, parseFloat(body[`ca2_${sId}`]) || 0));
        const scoreExam = Math.min(60, Math.max(0, parseFloat(body[`exam_${sId}`]) || 0));
        const total = score1 + score2 + scoreExam;
        const { grade, remark } = calculateGrade(total);

        db.get(
          "SELECT id FROM grades WHERE CAST(student_id AS TEXT) = ? AND CAST(subject_id AS TEXT) = ? AND term = ? AND session_year = ?",
          [String(studentId), String(cleanSubjectId), term, session_year],
          (err, existing) => {
            if (existing) {
              db.run(
                "UPDATE grades SET ca1 = ?, ca2 = ?, exam = ?, total = ?, grade = ?, remarks = ? WHERE id = ?",
                [score1, score2, scoreExam, total, grade, remark, existing.id],
                (err) => {
                  if (err) console.error("Error updating grade:", err);
                  resolve();
                }
              );
            } else {
              db.run(
                "INSERT INTO grades (student_id, subject_id, term, session_year, ca1, ca2, exam, total, grade, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [studentId, cleanSubjectId, term, session_year, score1, score2, scoreExam, total, grade, remark],
                (err) => {
                  if (err) console.error("Error inserting grade:", err);
                  resolve();
                }
              );
            }
          }
        );
      });
    });

    Promise.all(promises).then(() => {
      res.redirect(`/grades?class_filter=${encodeURIComponent(class_filter)}&subject_id=${cleanSubjectId}&term=${encodeURIComponent(term)}&session_year=${encodeURIComponent(session_year)}`);
    });
  });
};

exports.getReportCard = (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  const selectedTerm = req.query.term || '1st Term';
  const selectedSession = req.query.session_year || '2025/2026';

  fixGradesTable(() => {
    db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
      if (err || !student) return res.redirect('/students');

      const targetClass = (student.class || student.class_name || student.student_class || 'JSS 1').toString();
      const cleanClass = targetClass.toLowerCase().replace(/\s+/g, '');

      db.all("SELECT * FROM students", [], (err, allStudents) => {
        const classStudents = (allStudents || []).filter(s => {
          const sClass = (s.class_name || s.class || s.student_class || '').toString().toLowerCase().replace(/\s+/g, '');
          return sClass.includes(cleanClass);
        });
        const totalStudentsInClass = classStudents.length || 1;

        // Joined query with flexible string/number casting for subject_id
        const sql = `
          SELECT g.*, s.subject_name, s.subject_code 
          FROM grades g 
          JOIN subjects s ON CAST(g.subject_id AS TEXT) = CAST(s.id AS TEXT)
          WHERE CAST(g.student_id AS TEXT) = ? AND g.term = ? AND g.session_year = ?
        `;

        db.all(sql, [String(studentId), selectedTerm, selectedSession], (err, gradeRecords) => {
          let grandTotal = 0;
          let subjectCount = (gradeRecords || []).length;

          (gradeRecords || []).forEach(r => {
            grandTotal += (r.total || 0);
          });

          const overallAverage = subjectCount > 0 ? (grandTotal / subjectCount).toFixed(1) : '0.0';
          const classStudentIds = classStudents.map(s => String(s.id));

          db.all(
            "SELECT student_id, SUM(total) as student_grand_total FROM grades WHERE term = ? AND session_year = ? GROUP BY student_id",
            [selectedTerm, selectedSession],
            (err, totals) => {
              const classTotals = (totals || []).filter(t => classStudentIds.includes(String(t.student_id)));
              classTotals.sort((a, b) => b.student_grand_total - a.student_grand_total);

              let rank = 1;
              const targetIndex = classTotals.findIndex(t => String(t.student_id) === String(studentId));
              if (targetIndex !== -1) {
                rank = targetIndex + 1;
              }

              const positionText = getOrdinal(rank);

              res.render('grades/report-card', {
                student,
                grades: gradeRecords || [],
                term: selectedTerm,
                session_year: selectedSession,
                grandTotal,
                subjectCount,
                overallAverage,
                totalStudentsInClass,
                positionText,
                user: req.session ? req.session.user : null
              });
            }
          );
        });
      });
    });
  });
};
