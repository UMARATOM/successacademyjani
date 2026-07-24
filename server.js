const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./src/config/database');

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

// Serve Static Files (Public, Uploads, Images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Mount Routes
const indexRoutes = require('./src/routes/indexRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');
const gradeRoutes = require('./src/routes/gradeRoutes');

app.use('/', indexRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/subjects', subjectRoutes);
app.use('/grades', gradeRoutes);

app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System live on port ${PORT}`);
});
