const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const studentController = require('../controllers/studentController');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', studentController.getStudents);
router.get('/view/:id', studentController.getStudentDetails);
router.get('/register', studentController.getRegister);

router.post('/register', upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'primary_certificate', maxCount: 1 }
]), studentController.postRegister);

router.get('/edit/:id', studentController.getEdit);
router.post('/edit/:id', upload.fields([
  { name: 'passport', maxCount: 1 }
]), studentController.postEdit);

router.get('/delete/:id', studentController.getDelete);

module.exports = router;
