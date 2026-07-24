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
  const body = req.body || {};
  const full_name = body.full_name ? body.full_name.trim() : '';
  const class_name = body.class_name || '';
  const gender = body.gender || 'Male';
  const dob = body.dob || '';

  let passport_path = '';
  if (req.files && req.files['passport'] && req.files['passport'][0]) {
    passport_path = req.files['passport'][0].filename;
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
      { name: 'reg_number', type: 'TEXT' },
      { name: 'registration_number', type: 'TEXT' },
      { name: 'passport_path', type: 'TEXT' }
    ];

    const missing = requiredCols.filter(c => !existingCols.includes(c.name));
    const promises = missing.map(c => new Promise(resolve => db.run(`ALTER TABLE students ADD COLUMN ${c.name} ${c.type}`, () => resolve())));

    Promise.all(promises).then(() => {
      const currentYear = new Date().getFullYear();
      db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
        const count = (row && row.count) ? row.count : 0;
        const regNo = `SAJ/JS/${currentYear}/${String(count + 1).padStart(3, '0')}`;

        const cols = ['gender', 'dob'];
        const params = [gender, dob];

        if (passport_path) {
          cols.push('passport_path');
          params.push(passport_path);
        }

        ['fullname', 'full_name', 'name'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col);
            params.push(full_name);
          }
        });

        ['class', 'class_name'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col);
            params.push(class_name);
          }
        });

        ['reg_number', 'registration_number'].forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            cols.push(col);
            params.push(regNo);
          }
        });

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
  const full_name = body.full_name || '';
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
