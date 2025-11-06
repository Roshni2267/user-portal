const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');

const router = express.Router();

// GET signup
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'signup.html'));
});

// POST signup
router.post('/signup', (req, res) => {
  const db = req.db;
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.send('All fields are required.');
  }
  const hashed = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed], function(err) {
    if (err) {
      console.error(err.message);
      return res.send('Error creating user. Maybe email already exists.');
    }
    // redirect to login
    return res.redirect('/login');
  });
});

// GET login
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// POST login
router.post('/login', (req, res) => {
  const db = req.db;
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.send('DB error.');
    }
    if (!user) {
      return res.send('Invalid email or password.');
    }
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.send('Invalid email or password.');
    }
    // save session
    req.session.userId = user.id;
    req.session.userName = user.name;
    return res.redirect('/profile');
  });
});

// logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
