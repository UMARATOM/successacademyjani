const db = require('../config/database');

const getStudents = (req, res) => {
  const selectedClass = req.query.class_filter || 'ALL';

  let sql = "SELECT * FROM students";
  let params = [];

  if (selectedClass !== 'ALL') {
    sql += " WHERE class = ? OR class_name = ?";
    params = [selectedClass, selectedClass];
  }

  sql += " ORDER BY id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) console.error("Error fetching students:", err);
    res.render('students/list', {
      students: rows || [],
      selectedClass: selectedClass,
      user: req.session ? req.session.user : null
    });
  });
};

const getRegister = (req, res) => {
  res.render('students/register', { error: null, user: req.session ? req.session.user : null });
};

const postRegister = (req, res) => {
  const {
    fullname, full_name, name,
    student_class, class_name, class: rawClass,
    gender, dob, session_year,
    guardian_name, guardian_phone,
    reg_number, registration_number
  } = req.body || {};

  const cleanName = (fullname || full_name || name || '').trim();
  const cleanClass = (student_class || class_name || rawClass || 'JSS 1').trim();
  const cleanGender = (gender || 'Male').trim();
  const cleanDob = (dob || '').trim();
  const cleanSession = (session_year || '2025/2026').trim();
  const cleanGuardian = (guardian_name || '').trim();
  const cleanPhone = (guardian_phone || '').trim();
  let cleanReg = (reg_number || registration_number || '').trim();

  if (!cleanName) {
    return res.render('students/register', {
      error: 'Student Full Name is required.',
      user: req.session ? req.session.user : null
    });
  }

  let passport_path = '';
  let birth_cert = '';
  let primary_cert = '';

  if (Array.isArray(req.files)) {
    req.files.forEach(f => {
      if (f.fieldname === 'passport' || f.fieldname === 'passport_photo' || f.fieldname === 'photo') {
        passport_path = f.filename;
      } else if (f.fieldname === 'birth_cert') {
        birth_cert = f.filename;
      } else if (f.fieldname === 'primary_cert') {
        primary_cert = f.filename;
      } else if (!passport_path) {
        passport_path = f.filename; // fallback
      }
    });
  }

  const completeInsertion = (finalRegNo) => {
    const sql = `
      INSERT INTO students (
        fullname, full_name, name, class, class_name, gender, dob, session_year,
        guardian_name, guardian_phone, reg_number, registration_number,
        passport_path, birth_cert, primary_cert, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      cleanName, cleanName, cleanName,
      cleanClass, cleanClass,
      cleanGender, cleanDob, cleanSession,
      cleanGuardian, cleanPhone,
      finalRegNo, finalRegNo,
      passport_path, birth_cert, primary_cert,
      'Active'
    ];

    db.run(sql, values, (err) => {
      if (err) {
        console.error("Error registering student:", err);
        return res.render('students/register', {
          error: 'Failed to register student. Please try again.',
          user: req.session ? req.session.user : null
        });
      }
      res.redirect('/students');
    });
  };

  if (!cleanReg) {
    db.all("SELECT id FROM students", [], (err, rows) => {
      const nextId = (rows ? rows.length : 0) + 1;
      const formattedNumber = String(nextId).padStart(3, '0');
      let prefix = 'SAJ/JS/2026/';
      if (cleanClass.startsWith('Primary')) prefix = 'SAJ/PR/2026/';
      if (cleanClass.startsWith('Nursery')) prefix = 'SAJ/NR/2026/';
      completeInsertion(`${prefix}${formattedNumber}`);
    });
  } else {
    completeInsertion(cleanReg);
  }
};

const getEdit = (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM students WHERE id = ?", [id], (err, student) => {
    if (err || !student) return res.redirect('/students');
    res.render('students/edit', { student, error: null, user: req.session ? req.session.user : null });
  });
};

const postEdit = (req, res) => {
  const id = req.params.id;
  const { fullname, student_class, gender, guardian_phone, reg_number } = req.body || {};

  const sql = `
    UPDATE students SET 
      fullname = ?, full_name = ?, name = ?,
      class = ?, class_name = ?,
      gender = ?, guardian_phone = ?, reg_number = ?, registration_number = ?
    WHERE id = ?
  `;

  db.run(sql, [fullname, fullname, fullname, student_class, student_class, gender, guardian_phone, reg_number, reg_number, id], (err) => {
    if (err) console.error("Error updating student:", err);
    res.redirect('/students');
  });
};

const getDelete = (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM students WHERE id = ?", [id], () => {
    res.redirect('/students');
  });
};

module.exports = {
  getStudents,
  getRegister,
  postRegister,
  getEdit,
  postEdit,
  getDelete
};
