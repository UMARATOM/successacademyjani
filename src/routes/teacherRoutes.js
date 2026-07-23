const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Access Control Middleware
const requireAdmin = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/');
    if (req.session.role !== 'admin') {
        return res.status(403).send("<h1>Access Denied: Admin privileges required.</h1>");
    }
    next();
};

router.get('/teachers', requireAdmin, teacherController.listTeachers);
router.get('/teachers/register', requireAdmin, teacherController.showAddForm);
router.post('/teachers/register', requireAdmin, teacherController.registerTeacher);
router.get('/teachers/delete/:id', requireAdmin, teacherController.deleteTeacher);

module.exports = router;
