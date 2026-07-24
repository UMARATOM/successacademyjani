const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = (username || '').trim().toLowerCase();

  // 1. Administrative Master Login Check
  if (cleanUsername === 'admin' && password === 'admin123') {
    req.session.user = { username: 'admin', role: 'Administrator', fullname: 'System Admin' };
    return res.redirect('/dashboard');
  }

  // 2. Check Teacher Accounts in Database
  db.get("SELECT * FROM teachers WHERE LOWER(username) = ? AND password = ?", [cleanUsername, password], (err, teacher) => {
    if (teacher) {
      req.session.user = { 
        id: teacher.id, 
        username: teacher.username, 
        role: 'Teacher', 
        fullname: teacher.fullname 
      };
      // Staff members go directly to Manage Students
      return res.redirect('/students');
    }

    res.render('login', { error: 'Invalid Username or Password' });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Error destroying session:", err);
    res.redirect('/login');
  });
});

module.exports = router;
