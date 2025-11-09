const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// GET profile
router.get('/profile', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'profile.html'));
});

// POST profile
router.post('/profile', requireLogin, (req, res) => {
  const db = req.db;
  const userId = req.session.userId;
  const { first_name, last_name, phone, email, address } = req.body;

  // Check if profile exists
  db.get('SELECT * FROM profiles WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.send('DB error.');
    }
    if (row) {
      // update
      db.run(
        'UPDATE profiles SET first_name=?, last_name=?, phone=?, email=?, address=? WHERE user_id=?',
        [first_name, last_name, phone, email, address, userId],
        function (err2) {
          if (err2) {
            console.error(err2.message);
            return res.send('Error updating profile.');
          }
          // Send welcome email
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          });
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome!',
            text: `Hey ${first_name}, thanks for signing up! Your details have been saved successfully.`
          });

          return res.redirect('/profile?saved=1');
        }
      );
    } else {
      // insert
      db.run(
        'INSERT INTO profiles (user_id, first_name, last_name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, first_name, last_name, phone, email, address],
        function (err2) {
          if (err2) {
            console.error(err2.message);
            return res.send('Error saving profile.');
          }
          // Send welcome email
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          });
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome!',
            text: `Hey ${first_name}, thanks for signing up! Your details have been saved successfully.`
          });

          return res.redirect('/profile?saved=1');
        }
      );
    }
  });
});

module.exports = router;
