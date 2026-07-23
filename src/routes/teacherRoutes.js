const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/', teacherController.getTeachers);
router.get('/register', teacherController.getRegister);
router.post('/register', teacherController.postRegister);
module.exports = router;
