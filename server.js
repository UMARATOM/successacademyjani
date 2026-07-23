const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const gradeRoutes = require('./src/routes/gradeRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets cleanly
app.use(express.static(path.join(__dirname, 'src/public')));
app.use('/uploads', express.static(path.join(__dirname, 'src/public/uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use(session({
  secret: 'success_academy_jani_secure_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', teacherRoutes);
app.use('/', gradeRoutes);
app.use('/', subjectRoutes);

// Binding to '0.0.0.0' allows phones and local network devices to connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Success Academy System live on http://localhost:${PORT}`);
  console.log(`[NETWORK] Connect from your phone using your local IP (e.g. http://YOUR_IP:${PORT})`);
});
