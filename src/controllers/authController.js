const db = require('../config/database');

exports.showLogin = (req, res) => {
    res.render('login', { error: null });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            return res.render('login', { error: 'Database error occurred.' });
        }
        if (!user || user.password !== password) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Save user details to the session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.redirect('/dashboard');
    });
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
