const db = require('../config/database');
const fs = require('fs');

// GET Student List with Flexible Class Filtering
exports.getStudents = (req, res) => {
  const selectedClass = req.query.class_filter || 'ALL';
  
  let sql = "SELECT * FROM students";
  let params = [];

  if (selectedClass !== 'ALL') {
    // Trim and allow partial match so 'JSS 1' matches 'JSS 1', 'JSS1', etc.
    const cleanClass = selectedClass.trim();
    sql += " WHERE class LIKE ? OR class_name LIKE ? OR student_class LIKE ?";
    params = [`%${cleanClass}%`, `%${cleanClass}%`, `%${cleanClass}%`];
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

exports.getStudentDetails = (req, res) => {
  const studentId = req.params.id;
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.redirect('/students');
    res.render('students/view-details', { student: student, user: req.session ? req.session.user : null });
  });
};

exports.getRegister = (req, res) => {
  res.render('students/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  const body = req.body || {};
  const full_name = body.full_name ? body.full_name.trim() : '';
  const class_name = body.class_name || '';
  const gender = body.gender || 'Male';
  const dob = body.dob || '';
  const session_year = body.session_year || '2025/2026';
  const guardian_name = body.guardian_name || '';
  const guardian_phone = body.guardian_phone || '';

  const getBase64 = (fileArray) => {
    if (fileArray && fileArray[0]) {
      const file = fileArray[0];
      const buffer = fs.readFileSync(file.path);
      return `data:${file.mimetype};base64,${buffer.toString('base64')}`;
    }
    return '';
  };

  let passport_path = getBase64(req.files ? req.files['passport'] : null);
  let birth_cert = getBase64(req.files ? req.files['birth_certificate'] : null);
  let primary_cert = getBase64(req.files ? req.files['primary_certificate'] : null);

  if (!full_name || !class_name) {
    return res.render('students/register', { 
      error: 'Student Full Name and Class are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  db.all("PRAGMA table_info(students)", [], (pragmaErr, columns) => {
    const existingCols = (columns || []).map(c => c.name);
    const requiredCols = [
      { name: 'fullname', type: 'TEXT' },
      { name: 'full_name', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'class', type: 'TEXT' },
      { name: 'class_name', type: 'TEXT' },
      { name: 'gender', type: 'TEXT' },
      { name: 'dob', type: 'TEXT' },
      { name: 'session_year', type: 'TEXT' },
      { name: 'guardian_name', type: 'TEXT' },
      { name: 'guardian_phone', type: 'TEXT' },
      { name: 'reg_number', type: 'TEXT' },
      { name: 'registration_number', type: 'TEXT' },
      { name: 'passport_path', type: 'TEXT' },
      { name: 'birth_cert', type: 'TEXT' },
      { name: 'primary_cert', type: 'TEXT' },
      { name: 'status', type: 'TEXT' }
    ];

    const missing = requiredCols.filter(c => !existingCols.includes(c.name));
    const promises = missing.map(c => new Promise(resolve => db.run(`ALTER TABLE students ADD COLUMN ${c.name} ${c.type}`, () => resolve())));

    Promise.all(promises).then(() => {
      const currentYear = new Date().getFullYear();
      db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
        const count = (row && row.count) ? row.count : 0;
        const regNo = `SAJ/JS/${currentYear}/${String(count + 1).padStart(3, '0')}`;

        const cols = ['gender', 'dob', 'session_year', 'status'];
        const params = [gender, dob, session_year, 'Active'];

        if (passport_path) { cols.push('passport_path'); params.push(passport_path); }
        if (birth_cert) { cols.push('birth_cert'); params.push(birth_cert); }
        if (primary_cert) { cols.push('primary_cert'); params.push(primary_cert); }

        ['fullname', 'full_name', 'name'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col); params.push(full_name);
          }
        });

        ['class', 'class_name'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col); params.push(class_name);
          }
        });

        ['reg_number', 'registration_number'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col); params.push(regNo);
          }
        });

        if (existingCols.includes('guardian_name') || missing.some(m => m.name === 'guardian_name')) {
          cols.push('guardian_name'); params.push(guardian_name);
        }
        if (existingCols.includes('guardian_phone') || missing.some(m => m.name === 'guardian_phone')) {
          cols.push('guardian_phone'); params.push(guardian_phone);
        }

        const placeholders = cols.map(() => '?').join(', ');
        db.run(`INSERT INTO students (${cols.join(', ')}) VALUES (${placeholders})`, params, (dbErr) => {
          if (dbErr) console.error("Database insert error:", dbErr);
          res.redirect('/students');
        });
      });
    });
  });
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
  const session_year = body.session_year || '2025/2026';
  const status = body.status || 'Active';

  let passport_path = null;
  if (req.files && req.files['passport'] && req.files['passport'][0]) {
    const file = req.files['passport'][0];
    const buffer = fs.readFileSync(file.path);
    passport_path = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
  }

  let sql = `UPDATE students SET fullname = ?, full_name = ?, name = ?, class = ?, class_name = ?, gender = ?, session_year = ?, status = ?`;
  let params = [full_name, full_name, full_name, class_name, class_name, gender, session_year, status];

  if (passport_path) {
    sql += `, passport_path = ?`;
    params.push(passport_path);
  }

  sql += ` WHERE id = ?`;
  params.push(studentId);

  db.run(sql, params, (err) => {
    if (err) console.error("Error updating student:", err);
    res.redirect('/students');
  });
};

exports.getDelete = (req, res) => {
  const studentId = req.params.id;
  db.run("DELETE FROM students WHERE id = ?", [studentId], () => {
    res.redirect('/students');
  });
};
