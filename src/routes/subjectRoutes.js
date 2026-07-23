const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

const requireAdmin = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/');
  if (req.session.role !== 'admin') return res.status(403).send("Admin Access Required");
  next();
};

router.get('/subjects', requireAdmin, subjectController.listSubjects);
router.post('/subjects/add', requireAdmin, subjectController.addSubject);

module.exports = router;
