const db = require('../config/database');

exports.getStudents = (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    if (err) console.error("Error fetching students:", err);
    res.render('students/list', { students: rows || [], user: req.session ? req.session.user : null });
  });
};

exports.getRegister = (req, res) => {
  res.render('students/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  res.redirect('/students');
};

// GET: Edit Student Page with safe fallback
exports.getEdit = (req, res) => {
  const studentId = req.params.id;
  console.log("Fetching student for edit ID:", studentId);
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err) {
      console.error("Database error in getEdit:", err);
      return res.status(500).send("Database error loading student edit page: " + err.message);
    }
    if (!student) {
      console.warn("No student found with ID:", studentId);
      return res.redirect('/students');
    }
    res.render('students/edit', { student: student, error: null, user: req.session ? req.session.user : null });
  });
};

// POST: Save Student Edit
exports.postEdit = (req, res) => {
  const studentId = req.params.id;
  const body = req.body || {};
  const full_name = body.full_name ? body.full_name.trim() : '';
  const class_name = body.class_name || '';
  const gender = body.gender || 'Male';

  const sql = `UPDATE students SET 
               fullname = ?, full_name = ?, name = ?, 
               class = ?, class_name = ?, gender = ? 
               WHERE id = ?`;
  const params = [full_name, full_name, full_name, class_name, class_name, gender, studentId];

  db.run(sql, params, (err) => {
    if (err) {
      console.error("Error updating student record:", err);
    }
    res.redirect('/students');
  });
};

// GET: Delete Student
exports.getDelete = (req, res) => {
  const studentId = req.params.id;
  db.run("DELETE FROM students WHERE id = ?", [studentId], (err) => {
    if (err) console.error("Error deleting student:", err);
    res.redirect('/students');
  });
};
