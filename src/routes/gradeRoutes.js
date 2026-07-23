const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

router.get('/', gradeController.getEnterGrades);
router.get('/report-card/:studentId', gradeController.getReportCard);
router.post('/enter', gradeController.postEnterGrades);

module.exports = router;
