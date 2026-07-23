const db = require('../config/database');

exports.getTeachers = (req, res) => {
  db.all("SELECT * FROM teachers ORDER BY id DESC", [], (err, rows) => {
    res.render('teachers/list', { teachers: rows || [], user: req.session ? req.session.user : null });
  });
};

exports.getRegister = (req, res) => {
  res.render('teachers/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  const body = req.body || {};
  const full_name = body.full_name ? body.full_name.trim() : '';
  const role = body.role || 'Teacher';
  const phone = body.phone || '';
  const email = body.email || '';

  if (!full_name) {
    return res.render('teachers/register', { error: 'Staff Full Name is required.', user: req.session ? req.session.user : null });
  }

  db.all("PRAGMA table_info(teachers)", [], (pragmaErr, columns) => {
    const existingCols = (columns || []).map(c => c.name);
    const requiredCols = [
      { name: 'full_name', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'role', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'staff_id', type: 'TEXT' }
    ];

    const missing = requiredCols.filter(c => !existingCols.includes(c.name));
    const promises = missing.map(c => new Promise(res => db.run(`ALTER TABLE teachers ADD COLUMN ${c.name} ${c.type}`, () => res())));

    Promise.all(promises).then(() => {
      const currentYear = new Date().getFullYear();
      db.get("SELECT COUNT(*) AS count FROM teachers", [], (err, row) => {
        const count = (row && row.count) ? row.count : 0;
        const staff_id = `SAJ/STF/${currentYear}/${String(count + 1).padStart(3, '0')}`;

        const colsToInsert = ['role', 'phone', 'email', 'staff_id'];
        const params = [role, phone, email, staff_id];

        if (existingCols.includes('full_name') || missing.some(m => m.name === 'full_name')) {
          colsToInsert.push('full_name');
          params.push(full_name);
        }
        if (existingCols.includes('name') || missing.some(m => m.name === 'name')) {
          colsToInsert.push('name');
          params.push(full_name);
        }

        const placeholders = colsToInsert.map(() => '?').join(', ');
        db.run(`INSERT INTO teachers (${colsToInsert.join(', ')}) VALUES (${placeholders})`, params, (dbErr) => {
          if (dbErr) {
            console.error("Teacher insert error:", dbErr);
            return res.render('teachers/register', { error: dbErr.message, user: req.session ? req.session.user : null });
          }
          res.redirect('/teachers');
        });
      });
    });
  });
};
