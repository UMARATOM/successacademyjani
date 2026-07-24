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

exports.getEdit = (req, res) => {
  const studentId = req.params.id;
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.redirect('/students');
    res.render('students/edit', { student: student, error: null, user: req.session ? req.session.user : null });
  });
};

exports.postEdit = (req, res) => {
  const studentId = req.params.id;
  const body = req.body || {};
  const full_name = body.full_name ? body.full_name.trim() : '';
  const class_name = body.class_name || '';
  const gender = body.gender || 'Male';

  let passport_path = null;
  if (req.files && req.files['passport'] && req.files['passport'][0]) {
    passport_path = req.files['passport'][0].filename;
  }

  let sql = `UPDATE students SET fullname = ?, full_name = ?, name = ?, class = ?, class_name = ?, gender = ?`;
  let params = [full_name, full_name, full_name, class_name, class_name, gender];

  if (passport_path) {
    sql += `, passport_path = ?`;
    params.push(passport_path);
  }

  sql += ` WHERE id = ?`;
  params.push(studentId);

  db.run(sql, params, (err) => {
    if (err) {
      console.error("Error updating student:", err);
    }
    res.redirect('/students');
  });
};

exports.getDelete = (req, res) => {
  const studentId = req.params.id;
  db.run("DELETE FROM students WHERE id = ?", [studentId], () => {
    res.redirect('/students');
  });
};
