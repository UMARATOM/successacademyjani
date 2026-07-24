const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.getStudents);
router.get('/register', studentController.getRegister);
router.post('/register', studentController.postRegister);

// Edit & Delete Routes
router.get('/edit/:id', studentController.getEdit);
router.post('/edit/:id', studentController.postEdit);
router.get('/delete/:id', studentController.getDelete);

module.exports = router;
