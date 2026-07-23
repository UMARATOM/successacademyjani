const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.get('/', subjectController.getSubjects);
router.post('/', subjectController.postSubjects);
module.exports = router;
