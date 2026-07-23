const db = require('../config/database');

// GET: List all students
exports.getStudents = (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    if (err) console.error("Error fetching students:", err);
    res.render('students/list', { students: rows || [], user: req.session ? req.session.user : null });
  });
};

// GET: Render Registration Form
exports.getRegister = (req, res) => {
  res.render('students/register', { error: null, user: req.session ? req.session.user : null });
};

// POST: Register New Student safely in SQLite
exports.postRegister = (req, res) => {
  const full_name = req.body.full_name ? req.body.full_name.trim() : '';
  const class_name = req.body.class_name || '';
  const gender = req.body.gender || 'Male';
  const dob = req.body.dob || '';
  const guardian_name = req.body.parent_name || req.body.guardian_name || '';
  const guardian_phone = req.body.parent_phone || req.body.guardian_phone || '';

  if (!full_name || !class_name) {
    return res.render('students/register', { 
      error: 'Student Full Name and Class Category are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  // Split full name into first and last
  const nameParts = full_name.split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || '';

  // Generate sequential Registration Number (e.g., SAJ/2026/001)
  const currentYear = new Date().getFullYear();
  db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
    const count = (row && row.count) ? row.count : 0;
    const nextNum = String(count + 1).padStart(3, '0');
    const registration_number = `SAJ/${currentYear}/${nextNum}`;

    const sql = `INSERT INTO students (registration_number, first_name, last_name, class_name, gender, dob, guardian_name, guardian_phone) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [registration_number, first_name, last_name, class_name, gender, dob, guardian_name, guardian_phone];

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
};

exports.getEdit = (req, res) => res.redirect('/students');
exports.postEdit = (req, res) => res.redirect('/students');
exports.getPrint = (req, res) => res.redirect('/students');
