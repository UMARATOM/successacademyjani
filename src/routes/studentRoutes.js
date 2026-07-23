const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.getStudents);
router.get('/register', studentController.getRegister);
router.post('/register', studentController.postRegister);
module.exports = router;
