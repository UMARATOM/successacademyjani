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
  const guardian_name = body.parent_name || body.guardian_name || '';
  const guardian_phone = body.parent_phone || body.guardian_phone || '';

  if (!full_name || !class_name) {
    return res.render('students/register', { 
      error: 'Student Full Name and Class Category are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  const nameParts = full_name.split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || '';

  // Inspect existing columns in 'students' table
  db.all("PRAGMA table_info(students)", [], (pragmaErr, columns) => {
    const existingCols = (columns || []).map(c => c.name);

    // List all potential columns so we can auto-create if missing
    const requiredCols = [
      { name: 'fullname', type: 'TEXT' },
      { name: 'full_name', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'first_name', type: 'TEXT' },
      { name: 'last_name', type: 'TEXT' },
      { name: 'class_name', type: 'TEXT' },
      { name: 'gender', type: 'TEXT' },
      { name: 'dob', type: 'TEXT' },
      { name: 'guardian_name', type: 'TEXT' },
      { name: 'guardian_phone', type: 'TEXT' },
      { name: 'reg_number', type: 'TEXT' },
      { name: 'registration_number', type: 'TEXT' },
      { name: 'passport_path', type: 'TEXT' }
    ];

    const missing = requiredCols.filter(c => !existingCols.includes(c.name));
    const addColumnPromises = missing.map(c => {
      return new Promise((resolve) => {
        db.run(`ALTER TABLE students ADD COLUMN ${c.name} ${c.type}`, () => resolve());
      });
    });

    Promise.all(addColumnPromises).then(() => {
      const currentYear = new Date().getFullYear();
      db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
        const count = (row && row.count) ? row.count : 0;
        const nextNum = String(count + 1).padStart(3, '0');
        const generatedRegNo = `SAJ/${currentYear}/${nextNum}`;

        const colsToInsert = ['class_name', 'gender', 'dob'];
        const params = [class_name, gender, dob];

        // Populate EVERY possible name column to satisfy all NOT NULL constraints
        const nameCols = ['fullname', 'full_name', 'name'];
        nameCols.forEach(col => {
          if (existingCols.includes(col) || missing.some(m => m.name === col)) {
            colsToInsert.push(col);
            params.push(full_name);
          }
        });

        // First and Last Name
        if (existingCols.includes('first_name') || missing.some(m => m.name === 'first_name')) {
          colsToInsert.push('first_name');
          params.push(first_name);
        }
        if (existingCols.includes('last_name') || missing.some(m => m.name === 'last_name')) {
          colsToInsert.push('last_name');
          params.push(last_name);
        }

        // Registration Numbers
        if (existingCols.includes('reg_number') || missing.some(m => m.name === 'reg_number')) {
          colsToInsert.push('reg_number');
          params.push(generatedRegNo);
        }
        if (existingCols.includes('registration_number') || missing.some(m => m.name === 'registration_number')) {
          colsToInsert.push('registration_number');
          params.push(generatedRegNo);
        }

        // Guardian Information
        if (existingCols.includes('guardian_name') || missing.some(m => m.name === 'guardian_name')) {
          colsToInsert.push('guardian_name');
          params.push(guardian_name);
        }
        if (existingCols.includes('guardian_phone') || missing.some(m => m.name === 'guardian_phone')) {
          colsToInsert.push('guardian_phone');
          params.push(guardian_phone);
        }

        const placeholders = colsToInsert.map(() => '?').join(', ');
        const sql = `INSERT INTO students (${colsToInsert.join(', ')}) VALUES (${placeholders})`;

        db.run(sql, params, function(dbErr) {
          if (dbErr) {
            console.error("Database error registering student:", dbErr);
            return res.render('students/register', { 
              error: 'Failed to save registration: ' + dbErr.message, 
              user: req.session ? req.session.user : null 
            });
          }
          res.redirect('/students');
        });
      });
    });
  });
};

exports.getEdit = (req, res) => res.redirect('/students');
exports.postEdit = (req, res) => res.redirect('/students');
exports.getPrint = (req, res) => res.redirect('/students');
