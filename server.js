require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// Make db accessible in req
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Static
app.use('/public', express.static(path.join(__dirname, 'public')));

// Views
app.use('/views', express.static(path.join(__dirname, 'views')));

// Routes
app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/', adminRoutes);

// Root
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Weekly reminder - Every Monday at 09:00
cron.schedule('13 16 * * 6', () => {
  console.log('Running weekly email job...');
  db.all('SELECT DISTINCT email FROM profiles WHERE email IS NOT NULL AND email != ""', [], async (err, rows) => {
    if (err) {
      return console.error('Error fetching emails:', err.message);
    }
    if (!rows || rows.length === 0) {
      console.log('No profile emails found, checking users table...');
      db.all('SELECT DISTINCT email FROM users WHERE email IS NOT NULL AND email != ""', [], async (err2, userRows) => {
        if (err2) {
          return console.error('Error fetching user emails:', err2.message);
        }
        await sendBulkEmails(userRows);
      });
    } else {
      await sendBulkEmails(rows);
    }
  });
});

async function sendBulkEmails(rows) {
  for (const row of rows) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: row.email,
      subject: 'Weekly Reminder',
      text: 'Hello, this is your weekly reminder email.'
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log('Reminder sent to:', row.email);
    } catch (e) {
      console.error('Error sending to', row.email, e.message);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
