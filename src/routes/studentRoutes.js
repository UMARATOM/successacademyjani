const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');

// Disk storage so uploaded files keep their extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', studentController.getStudents);
router.get('/register', studentController.getRegister);

router.post('/register', upload.fields([
  { name: 'passport', maxCount: 1 }
]), studentController.postRegister);

router.get('/edit/:id', studentController.getEdit);

// Enable file upload handling on student edit POST submit
router.post('/edit/:id', upload.fields([
  { name: 'passport', maxCount: 1 }
]), studentController.postEdit);

router.get('/delete/:id', studentController.getDelete);

module.exports = router;
