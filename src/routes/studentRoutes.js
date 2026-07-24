const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', studentController.getStudents);
router.get('/register', studentController.getRegister);

// Accept ANY uploaded image fields dynamically
router.post('/register', upload.any(), studentController.postRegister);

router.get('/edit/:id', studentController.getEdit);
router.post('/edit/:id', studentController.postEdit);
router.get('/delete/:id', studentController.getDelete);

module.exports = router;
