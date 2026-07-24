const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

// Single Student Report Card Route
if (gradeController && gradeController.getReportCard) {
  router.get('/report-card/:id', gradeController.getReportCard);
} else {
  router.get('/report-card/:id', (req, res) => res.redirect('/students'));
}

// Fallback index for grades
router.get('/', (req, res) => {
  res.redirect('/students');
});

module.exports = router;
