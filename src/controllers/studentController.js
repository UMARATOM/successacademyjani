const db = require('../config/database');

exports.getStudents = (req, res) => {
  const selectedClass = req.query.class_filter || 'ALL';

  let sql = "SELECT * FROM students";
  let params = [];

  if (selectedClass !== 'ALL') {
    sql += " WHERE class = $1 OR class_name = $1";
    params = [selectedClass];
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

exports.getRegister = (req, res) => {
  res.render('students/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
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
  if (req.files && req.files.passport && req.files.passport[0]) {
    passport_path = req.files.passport[0].filename;
  }

  let birth_cert = '';
  if (req.files && req.files.birth_cert && req.files.birth_cert[0]) {
    birth_cert = req.files.birth_cert[0].filename;
  }

  let primary_cert = '';
  if (req.files && req.files.primary_cert && req.files.primary_cert[0]) {
    primary_cert = req.files.primary_cert[0].filename;
  }

  const completeInsertion = (finalRegNo) => {
    const sql = `
      INSERT INTO students (
        fullname, full_name, name, class, class_name, gender, dob, session_year,
        guardian_name, guardian_phone, reg_number, registration_number,
        passport_path, birth_cert, primary_cert, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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

exports.getEdit = (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM students WHERE id = $1", [id], (err, student) => {
    if (err || !student) return res.redirect('/students');
    res.render('students/edit', { student, error: null, user: req.session ? req.session.user : null });
  });
};

exports.postEdit = (req, res) => {
  const id = req.params.id;
  const { fullname, student_class, gender, guardian_phone, reg_number } = req.body || {};

  const sql = `
    UPDATE students SET 
      fullname = $1, full_name = $1, name = $1,
      class = $2, class_name = $2,
      gender = $3, guardian_phone = $4, reg_number = $5, registration_number = $5
    WHERE id = $6
  `;

  db.run(sql, [fullname, student_class, gender, guardian_phone, reg_number, id], (err) => {
    if (err) console.error("Error updating student:", err);
    res.redirect('/students');
  });
};

exports.getDelete = (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM students WHERE id = $1", [id], () => {
    res.redirect('/students');
  });
};
