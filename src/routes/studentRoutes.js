const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');

const requireLogin = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/');
    next();
};

// Configure Multer Storage to absolute path
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Pointing directly to src/public/uploads
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Define routes
router.get('/students', requireLogin, studentController.listStudents);
router.get('/students/register', requireLogin, studentController.showRegisterForm);

router.post('/students/register', requireLogin, upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'birth_cert', maxCount: 1 },
    { name: 'primary_cert', maxCount: 1 }
]), studentController.registerStudent);

router.get('/students/edit/:id', requireLogin, studentController.showEditForm);
router.post('/students/edit/:id', requireLogin, upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'birth_cert', maxCount: 1 },
    { name: 'primary_cert', maxCount: 1 }
]), studentController.updateStudent);

router.get('/students/delete/:id', requireLogin, studentController.deleteStudent);
router.get('/students/print', requireLogin, studentController.printStudents);

module.exports = router;
