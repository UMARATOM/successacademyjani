const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.listStudents = (req, res) => {
  const selectedClass = req.query.class || '';
  let query = "SELECT * FROM students";
  let params = [];
  if (selectedClass) {
    query += " WHERE class = ?";
    params.push(selectedClass);
  }
  query += " ORDER BY id DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).send("Database error occurred.");
    db.all("SELECT DISTINCT class FROM students", [], (err2, classes) => {
      const classList = classes ? classes.map(c => c.class) : [];
      res.render('students/list', {
        students: rows,
        classes: classList,
        selectedClass: selectedClass,
        user: req.session
      });
    });
  });
};

exports.showRegisterForm = (req, res) => {
  res.render('students/register', { error: null, user: req.session });
};

exports.registerStudent = (req, res) => {
  const { fullname, s_class, gender, dob, parent_name, parent_phone } = req.body;
  const passport = req.files && req.files['passport'] ? '/uploads/' + req.files['passport'][0].filename : null;
  const birth_cert = req.files && req.files['birth_cert'] ? '/uploads/' + req.files['birth_cert'][0].filename : null;
  const primary_cert = req.files && req.files['primary_cert'] ? '/uploads/' + req.files['primary_cert'][0].filename : null;

  const lowerClass = s_class.toLowerCase().trim();
  const isJss = lowerClass.startsWith('jss');

  if (!passport) return res.render('students/register', { error: 'Passport Photograph is required.', user: req.session });
  if (!birth_cert) return res.render('students/register', { error: 'Birth Certificate is required.', user: req.session });
  if (isJss && !primary_cert) return res.render('students/register', { error: 'Primary Certificate is required for JSS classes.', user: req.session });

  let prefixGroup = '';
  let categoryPattern = '';
  if (lowerClass.includes('pre-nursery')) { prefixGroup = 'SAJ/PRE-NUR/2026/'; categoryPattern = 'Pre-Nursery'; }
  else if (lowerClass.includes('nursery')) { prefixGroup = 'SAJ/NUR/2026/'; categoryPattern = 'Nursery%'; }
  else if (lowerClass.includes('primary')) { prefixGroup = 'SAJ/PRI/2026/'; categoryPattern = 'Primary%'; }
  else if (lowerClass.startsWith('jss')) { prefixGroup = 'SAJ/JS/2026/'; categoryPattern = 'JSS%'; }
  else { prefixGroup = 'SAJ/GEN/2026/'; categoryPattern = 'General'; }

  db.get("SELECT COUNT(*) as count FROM students WHERE class LIKE ?", [categoryPattern], (err, row) => {
    if (err) return res.render('students/register', { error: 'Error generating registration number.', user: req.session });
    
    const nextNumber = (row.count + 1).toString().padStart(3, '0');
    const calculatedRegNumber = `${prefixGroup}${nextNumber}`;

    db.run(
      `INSERT INTO students (reg_number, fullname, class, gender, dob, parent_name, parent_phone, passport_path, birth_cert_path, primary_cert_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [calculatedRegNumber, fullname, s_class, gender, dob, parent_name, parent_phone, passport, birth_cert, primary_cert],
      (insertErr) => {
        if (insertErr) {
          if (req.files) {
            Object.keys(req.files).forEach(key => { try { fs.unlinkSync(req.files[key][0].path); } catch(e){} });
          }
          return res.render('students/register', { error: 'System failed to insert student record.', user: req.session });
        }
        res.redirect('/students');
      }
    );
  });
};

exports.showEditForm = (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM students WHERE id = ?", [id], (err, student) => {
    if (err || !student) return res.redirect('/students');
    res.render('students/edit', { student, error: null, user: req.session });
  });
};

exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { fullname, s_class, gender, dob, parent_name, parent_phone, status } = req.body;
  db.get("SELECT * FROM students WHERE id = ?", [id], (err, student) => {
    if (err || !student) return res.redirect('/students');

    const passport = req.files && req.files['passport'] ? '/uploads/' + req.files['passport'][0].filename : student.passport_path;
    const birth_cert = req.files && req.files['birth_cert'] ? '/uploads/' + req.files['birth_cert'][0].filename : student.birth_cert_path;
    const primary_cert = req.files && req.files['primary_cert'] ? '/uploads/' + req.files['primary_cert'][0].filename : student.primary_cert_path;

    db.run(
      `UPDATE students SET fullname = ?, class = ?, gender = ?, dob = ?, parent_name = ?, parent_phone = ?, status = ?, passport_path = ?, birth_cert_path = ?, primary_cert_path = ? WHERE id = ?`,
      [fullname, s_class, gender, dob, parent_name, parent_phone, status, passport, birth_cert, primary_cert, id],
      (updateErr) => {
        if (updateErr) return res.render('students/edit', { student, error: 'Failed to update student.', user: req.session });
        res.redirect('/students');
      }
    );
  });
};

exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  db.get("SELECT passport_path, birth_cert_path, primary_cert_path FROM students WHERE id = ?", [id], (err, student) => {
    if (student) {
      const uploadDir = path.join(__dirname, '../public');
      if (student.passport_path) try { fs.unlinkSync(path.join(uploadDir, student.passport_path)); } catch(e) {}
      if (student.birth_cert_path) try { fs.unlinkSync(path.join(uploadDir, student.birth_cert_path)); } catch(e) {}
      if (student.primary_cert_path) try { fs.unlinkSync(path.join(uploadDir, student.primary_cert_path)); } catch(e) {}
    }
    db.run("DELETE FROM students WHERE id = ?", [id], () => {
      res.redirect('/students');
    });
  });
};

exports.printStudents = (req, res) => {
  const selectedClass = req.query.class || '';
  let query = "SELECT * FROM students";
  let params = [];
  if (selectedClass) {
    query += " WHERE class = ?";
    params.push(selectedClass);
  }
  query += " ORDER BY class ASC, fullname ASC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).send("Database error");
    db.all("SELECT DISTINCT class FROM students", [], (err2, classRows) => {
      const classList = classRows ? classRows.map(c => c.class) : [];
      res.render('students/print', { students: rows, classes: classList, selectedClass: selectedClass });
    });
  });
};
