const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.userId) return res.redirect('/dashboard');
    next();
};

const requireLogin = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/');
    next();
};

router.get('/', redirectIfLoggedIn, authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { user: req.session });
});

module.exports = router;
