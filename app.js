'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { passwordStrength } = require('check-password-strength');

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
const session = require('express-session');

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true
}));

// mock data for storing notes
let notes = [];

const users = [];


app.get('/', (req, res) => {
    const registrationForm = fs.readFileSync('./registration.html');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(registrationForm);
});

app.get('/register', (req, res) => {
  const registrationForm = fs.readFileSync('./registration.html');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(registrationForm);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Username and password are required');
  } else if (users.some(user => user.username === username)) {
    res.statusCode = 409;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Username already exists');
  } else if (passwordStrength(password).value === "Too weak" || passwordStrength(password).value === "Weak") {
    res.statusCode = 409;
    const weakForm = fs.readFileSync('./weak.html');
    res.setHeader('Content-Type', 'text/html');
    res.end(weakForm);
  } else {
    users.push({ username, password });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('User registered successfully');
    console.log("New User:\n", users)
  }
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.path === '/login' || req.session.user) {
      return next();
    } else {
      return res.redirect('/login');
    }
};

// Route to display notes
app.get('/home', requireLogin, (req, res) => {
    fs.readFile(path.join(__dirname, 'notes.txt'), 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error reading notes file');
        return;
      }
      const notes = data.trim().split('\n');
      res.render('home', { notes });
    });
});

// Route to handle note submission
app.post('/note', (req, res) => {
    const { note } = req.body;
    fs.appendFile(path.join(__dirname, 'notes.txt'), note + '\n', (err) => {
      if (err) throw err;
      res.redirect('/home');
    });
});

// Route to display notes
app.get('/note', (req, res) => {
  res.json(notes);
});

app.get('/login', (req, res) => {
  const loginForm = fs.readFileSync('./login.html');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(loginForm);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Incorrect username or password');
    } else {
      req.session.user = user;
      res.statusCode = 302;
      res.setHeader('Location', '/home');
      res.end();
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});