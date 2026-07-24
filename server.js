const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();

// Automatically create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Session
app.use(session({
  secret: 'success_academy_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Routes
const indexRoutes = require('./src/routes/indexRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const gradeRoutes = require('./src/routes/gradeRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');

app.use('/', indexRoutes);
app.use('/students', studentRoutes);
app.use('/grades', gradeRoutes);
app.use('/teachers', teacherRoutes);
app.use('/subjects', subjectRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System running on port ${PORT}`);
});
