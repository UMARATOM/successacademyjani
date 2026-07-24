const db = require('../config/database');

const fixSubjectsTable = (callback) => {
  db.all("PRAGMA table_info(subjects)", [], (err, columns) => {
    const colNames = (columns || []).map(c => c.name);
    if (!colNames.includes('class_category')) {
      db.run("DROP TABLE IF EXISTS subjects", [], () => {
        db.run(`CREATE TABLE subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject_name TEXT,
          subject_code TEXT,
          class_category TEXT
        )`, [], () => callback());
      });
    } else {
      callback();
    }
  });
};

exports.getSubjects = (req, res) => {
  const selectedClass = req.query.class_filter || 'ALL';

  fixSubjectsTable(() => {
    let sql = "SELECT * FROM subjects";
    let params = [];

    if (selectedClass !== 'ALL') {
      sql += " WHERE class_category = ? OR class_category = 'ALL'";
      params = [selectedClass];
    }

    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
      if (err) console.error("Error fetching subjects:", err);
      res.render('subjects/list', { 
        subjects: rows || [], 
        selectedClass: selectedClass,
        user: req.session ? req.session.user : null 
      });
    });
  });
};

exports.getRegister = (req, res) => {
  res.render('subjects/register', { error: null, user: req.session ? req.session.user : null });
};

exports.postRegister = (req, res) => {
  const { subject_name, subject_code, class_category } = req.body || {};

  if (!subject_name || !class_category) {
    return res.render('subjects/register', { 
      error: 'Subject Name and Class Category are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  const cleanName = subject_name.trim();
  const cleanCode = (subject_code || '').trim().toUpperCase();

  fixSubjectsTable(() => {
    db.run(
      "INSERT INTO subjects (subject_name, subject_code, class_category) VALUES (?, ?, ?)",
      [cleanName, cleanCode || 'SUB', class_category],
      (err) => {
        if (err) {
          console.error("Error creating subject:", err);
          return res.render('subjects/register', { 
            error: 'Failed to create subject. Please try again.', 
            user: req.session ? req.session.user : null 
          });
        }
        res.redirect('/subjects');
      }
    );
  });
};

exports.getEdit = (req, res) => {
  const subjectId = req.params.id;
  db.get("SELECT * FROM subjects WHERE id = ?", [subjectId], (err, subject) => {
    if (err || !subject) return res.redirect('/subjects');
    res.render('subjects/edit', { subject: subject, error: null, user: req.session ? req.session.user : null });
  });
};

exports.postEdit = (req, res) => {
  const subjectId = req.params.id;
  const { subject_name, subject_code, class_category } = req.body || {};

  if (!subject_name || !class_category) {
    return res.render('subjects/edit', { 
      subject: { id: subjectId, subject_name, subject_code, class_category },
      error: 'Subject Name and Class Category are required.', 
      user: req.session ? req.session.user : null 
    });
  }

  db.run(
    "UPDATE subjects SET subject_name = ?, subject_code = ?, class_category = ? WHERE id = ?",
    [subject_name.trim(), (subject_code || '').trim().toUpperCase(), class_category, subjectId],
    (err) => {
      if (err) console.error("Error updating subject:", err);
      res.redirect('/subjects');
    }
  );
};

exports.getDelete = (req, res) => {
  const subjectId = req.params.id;
  db.run("DELETE FROM subjects WHERE id = ?", [subjectId], () => {
    res.redirect('/subjects');
  });
};
