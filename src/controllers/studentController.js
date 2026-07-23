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

// POST: Register New Student in SQLite
exports.postRegister = (req, res) => {
  const { full_name, class_name, gender, dob, parent_name, parent_phone } = req.body;

  if (!full_name || !class_name) {
    return res.render('students/register', { 
      error: 'Student Full Name and Class Category are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  // Split name into first and last
  const nameParts = full_name.trim().split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || '';

  // Generate sequential Registration Number (e.g., SAJ/2026/001)
  const currentYear = new Date().getFullYear();
  db.get("SELECT COUNT(*) AS count FROM students", [], (err, row) => {
    const nextNum = String((row ? row.count : 0) + 1).padStart(3, '0');
    const registration_number = `SAJ/${currentYear}/${nextNum}`;

    const sql = `INSERT INTO students (registration_number, first_name, last_name, class_name, gender, dob, guardian_name, guardian_phone) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [registration_number, first_name, last_name, class_name, gender, dob, parent_name, parent_phone];

    db.run(sql, params, function(err) {
      if (err) {
        console.error("Database error registering student:", err);
        return res.render('students/register', { 
          error: 'Failed to save student record to database.', 
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
