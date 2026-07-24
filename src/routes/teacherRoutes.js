const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/', teacherController.getTeachers);
router.get('/register', teacherController.getRegister);
router.post('/register', teacherController.postRegister);
router.get('/edit/:id', teacherController.getEdit);
router.post('/edit/:id', teacherController.postEdit);
router.get('/delete/:id', teacherController.getDelete);

module.exports = router;
