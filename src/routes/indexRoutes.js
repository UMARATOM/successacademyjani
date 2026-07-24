const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Render Dashboard for both '/' and '/dashboard'
const renderDashboard = (req, res) => {
  db.all("SELECT * FROM students", [], (err, students) => {
    db.all("SELECT * FROM teachers", [], (err, teachers) => {
      db.all("SELECT * FROM subjects", [], (err, subjects) => {
        res.render('dashboard', {
          studentCount: students ? students.length : 0,
          teacherCount: teachers ? teachers.length : 0,
          subjectCount: subjects ? subjects.length : 0,
          user: req.session ? req.session.user : null
        });
      });
    });
  });
};

router.get('/', renderDashboard);
router.get('/dashboard', renderDashboard);

module.exports = router;
