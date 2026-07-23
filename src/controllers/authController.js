const db = require('../config/database');

exports.getLogin = (req, res) => res.render('login', { error: null });
exports.login = (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.render('login', { error: 'Enter username and password' });
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (err || !user) return res.render('login', { error: 'Invalid credentials' });
    if (req.session) req.session.user = user;
    res.redirect('/dashboard');
  });
};
exports.logout = (req, res) => {
  if (req.session) req.session.destroy(() => res.redirect('/login'));
  else res.redirect('/login');
};
exports.getDashboard = (req, res) => res.render('dashboard', { user: req.session ? req.session.user : null });
