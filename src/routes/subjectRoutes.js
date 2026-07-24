const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.get('/', subjectController.getSubjects);
router.get('/register', subjectController.getRegister);
router.post('/register', subjectController.postRegister);
router.get('/edit/:id', subjectController.getEdit);
router.post('/edit/:id', subjectController.postEdit);
router.get('/delete/:id', subjectController.getDelete);

module.exports = router;
