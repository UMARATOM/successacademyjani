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

  // Ensure missing columns exist right before insertion
  db.serialize(() => {
    db.run("ALTER TABLE students ADD COLUMN name TEXT", () => {});
    db.run("ALTER TABLE students ADD COLUMN first_name TEXT", () => {});
    db.run("ALTER TABLE students ADD COLUMN last_name TEXT", () => {});
    db.run("ALTER TABLE students ADD COLUMN registration_number TEXT", () => {});
    db.run("ALTER TABLE students ADD COLUMN guardian_name TEXT", () => {});
    db.run("ALTER TABLE students ADD COLUMN guardian_phone TEXT", () => {});

    const currentYear = new Date().getFullYear();
    db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
      const count = (row && row.count) ? row.count : 0;
      const nextNum = String(count + 1).padStart(3, '0');
      const registration_number = `SAJ/${currentYear}/${nextNum}`;

      const sql = `INSERT INTO students (name, first_name, last_name, class_name, gender, dob, guardian_name, guardian_phone, registration_number) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [full_name, first_name, last_name, class_name, gender, dob, guardian_name, guardian_phone, registration_number];

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
};

exports.getEdit = (req, res) => res.redirect('/students');
exports.postEdit = (req, res) => res.redirect('/students');
exports.getPrint = (req, res) => res.redirect('/students');
