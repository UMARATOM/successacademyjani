const express = require('express');
const router = express.Router();

// GET Login Page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST Login Handler
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  
  // Simple administrative credential check
  if (username === 'admin' && password === 'admin123') {
    req.session.user = { username: 'admin', role: 'Administrator' };
    return res.redirect('/students');
  }
  
  res.render('login', { error: 'Invalid Username or Password' });
});

// GET Logout Handler
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Error destroying session:", err);
    res.redirect('/login');
  });
});

module.exports = router;
