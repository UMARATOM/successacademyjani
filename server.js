const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

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

// Core Routes
const indexRoutes = require('./src/routes/indexRoutes');
const studentRoutes = require('./src/routes/studentRoutes');

app.use('/', indexRoutes);
app.use('/students', studentRoutes);

// Root Redirect to Login or Directory
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/students');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] Success Academy System running on port ${PORT}`);
});
