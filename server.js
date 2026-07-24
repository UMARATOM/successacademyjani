const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'success_academy_secret_key_2026',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const dashboardController = require('./src/controllers/dashboardController');

const indexRoutes = require('./src/routes/indexRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');
const gradeRoutes = require('./src/routes/gradeRoutes');

// Auth Middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
};

// Admin Only Middleware
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'Administrator') return next();
  res.redirect('/students');
};

app.use('/', indexRoutes);
app.use('/students', requireAuth, studentRoutes);
app.use('/teachers', requireAuth, requireAdmin, teacherRoutes);
app.use('/subjects', requireAuth, requireAdmin, subjectRoutes);
app.use('/grades', requireAuth, gradeRoutes);

app.get('/dashboard', requireAuth, requireAdmin, dashboardController.getDashboard);

app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'Administrator') {
      res.redirect('/dashboard');
    } else {
      res.redirect('/students');
    }
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System running on port ${PORT}`);
});
