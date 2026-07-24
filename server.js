const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Body Parsers & Session
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'success_academy_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Set EJS View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Safe Route Loader
const loadRoute = (routePath) => {
  const fullPath = path.join(__dirname, routePath);
  if (fs.existsSync(fullPath + '.js') || fs.existsSync(fullPath)) {
    return require(fullPath);
  }
  return null;
};

// Mount core routes
const studentRoutes = loadRoute('src/routes/studentRoutes');
const teacherRoutes = loadRoute('src/routes/teacherRoutes');
const subjectRoutes = loadRoute('src/routes/subjectRoutes');
const gradeRoutes = loadRoute('src/routes/gradeRoutes');

if (studentRoutes) app.use('/students', studentRoutes);
if (teacherRoutes) app.use('/teachers', teacherRoutes);
if (subjectRoutes) app.use('/subjects', subjectRoutes);
if (gradeRoutes) app.use('/grades', gradeRoutes);

// Home route redirect
app.get('/', (req, res) => {
  res.redirect('/students');
});

app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System live on port ${PORT}`);
});
