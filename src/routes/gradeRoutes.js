const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

router.get('/', gradeController.getGradebook);
router.post('/save', gradeController.postSaveGrades);
router.get('/report-card/:studentId', gradeController.getReportCard);

module.exports = router;
