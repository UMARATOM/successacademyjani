const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const gradeRoutes = require('./src/routes/gradeRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'success_academy_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Route mounting
app.use('/', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/grades', gradeRoutes);
app.use('/subjects', subjectRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System live on http://localhost:${PORT}`);
});
