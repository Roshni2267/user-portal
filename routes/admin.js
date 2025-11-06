const express = require('express');
const path = require('path');
const { Parser } = require('json2csv');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/admin-login');
  }
  next();
}

// admin login page
router.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'admin-login.html'));
});

// admin login submit
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  } else {
    return res.send('Invalid admin credentials');
  }
});

// admin dashboard
router.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'));
});

// API to get all profiles (for admin.html fetch)
router.get('/api/admin/profiles', requireAdmin, (req, res) => {
  const db = req.db;
  db.all(
    `SELECT p.id, u.name AS user_name, p.first_name, p.last_name, p.phone, p.email, p.address, p.created_at
     FROM profiles p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'DB error' });
      }
      return res.json(rows);
    }
  );
});

// CSV download
router.get('/admin/export', requireAdmin, (req, res) => {
  const db = req.db;
  db.all(
    `SELECT p.id, u.name AS user_name, p.first_name, p.last_name, p.phone, p.email, p.address, p.created_at
     FROM profiles p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('DB error.');
      }
      const fields = ['id', 'user_name', 'first_name', 'last_name', 'phone', 'email', 'address', 'created_at'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('profiles.csv');
      return res.send(csv);
    }
  );
});

module.exports = router;
