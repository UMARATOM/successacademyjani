const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

const requireFacultyPrivileges = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/');
  if (req.session.role !== 'admin' && req.session.role !== 'teacher') {
    return res.status(403).send("<h1>Access Denied</h1>");
  }
  next();
};

const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/');
  next();
};

router.get('/grades', requireFacultyPrivileges, gradeController.showGradebookSelector);
router.post('/grades/save', requireFacultyPrivileges, gradeController.saveBulkGrades);
router.post('/grades/remarks/save', requireFacultyPrivileges, gradeController.saveRemarks);
router.get('/grades/report-card/:studentId', requireLogin, gradeController.viewStudentReportCard);

module.exports = router;
