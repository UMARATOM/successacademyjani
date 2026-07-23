const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const studentController = require('../controllers/studentController');

router.get('/', studentController.getStudents);
router.get('/register', studentController.getRegister);

// Parse files and text inputs with multer middleware
router.post('/register', upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'primary_certificate', maxCount: 1 }
]), studentController.postRegister);

module.exports = router;
