const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 10000;

// Body Parsers & Session Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'success_academy_secret_key_2026',
  resave: false,
  saveUninitialized: false
}));

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Serve Public Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Controller Imports
const dashboardController = require('./src/controllers/dashboardController');
const teacherController = require('./src/controllers/teacherController');
const subjectController = require('./src/controllers/subjectController');
const gradeController = require('./src/controllers/gradeController');

// Route Imports
const indexRoutes = require('./src/routes/indexRoutes');
const studentRoutes = require('./src/routes/studentRoutes');

app.use('/', indexRoutes);
app.use('/students', studentRoutes);

// Navigation Routes
app.get('/dashboard', dashboardController.getDashboard);
app.get('/teachers', teacherController.getTeachers);
app.get('/subjects', subjectController.getSubjects);
app.get('/grades', gradeController.getGradebook);

// Root Redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System running on port ${PORT}`);
});
