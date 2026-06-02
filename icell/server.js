// server.js — Express API server for LBRCE International Cell registrations
// Start: node server.js

const express    = require('express');
const cors       = require('cors');
const { body, validationResult } = require('express-validator');
const pool       = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                  // allow requests from your HTML page
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (put your HTML files in a "public/" folder)
app.use(express.static('public'));

// ── Validation Rules ──────────────────────────────────────────────────────────
const registrationRules = [
  body('full_name')
    .trim().notEmpty().withMessage('Full name is required.')
    .isLength({ max: 120 }),

  body('student_id')
    .trim().notEmpty().withMessage('Student ID is required.')
    .isLength({ max: 50 }),

  body('email')
    .trim().isEmail().withMessage('Valid email is required.')
    .normalizeEmail(),

  body('phone')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^[+\d\s\-]{10,25}$/).withMessage('Invalid phone number.'),

  body('department')
    .trim().notEmpty().withMessage('Department is required.'),

  body('year_of_study')
    .trim().notEmpty().withMessage('Year of study is required.'),

  body('cgpa')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10.'),

  body('programs')
    .trim().notEmpty().withMessage('Please select at least one program.'),

  body('goals')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }),
];

// ── POST /api/register ────────────────────────────────────────────────────────
app.post('/api/register', registrationRules, async (req, res) => {
  // 1. Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => e.msg),
    });
  }

  const {
    full_name, student_id, email, phone,
    department, year_of_study, cgpa,
    target_country, programs, intake,
    goals, referral,
  } = req.body;

  const registeredAt = new Date();

  const INSERT_SQL = `
    INSERT INTO registrations
      (full_name, student_id, email, phone, department, year_of_study,
       cgpa, target_country, programs, intake, goals, referral, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    full_name,
    student_id,
    email,
    phone,
    department,
    year_of_study,
    cgpa || null,
    target_country || null,
    programs,
    intake || null,
    goals || null,
    referral || null,
    registeredAt,
  ];

  try {
    const [result] = await pool.execute(INSERT_SQL, values);
    console.log(`✅  New registration saved — ID: ${result.insertId} | ${full_name} | ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! We will contact you soon.',
      registration_id: result.insertId,
    });

  } catch (err) {
    // Duplicate email or student_id
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('email') ? 'email address' : 'student ID';
      return res.status(409).json({
        success: false,
        errors: [`This ${field} is already registered.`],
      });
    }

    console.error('❌  DB error:', err.message);
    return res.status(500).json({
      success: false,
      errors: ['Server error. Please try again later.'],
    });
  }
});

// ── GET /api/registrations — Admin: view all registrations ───────────────────
// Protect this with authentication in production!
app.get('/api/registrations', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM registrations ORDER BY registered_at DESC'
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  LBRCE Registration Server running at http://localhost:${PORT}`);
});