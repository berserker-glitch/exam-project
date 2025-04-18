const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamById } = require('../controllers/exams');
const isAuthenticated = require('../middleware/auth');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// JWT Secret for token verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Create a new exam (protected route)
router.post('/', isAuthenticated, createExam);

// Get all exams (with optional filters)
router.get('/', isAuthenticated, getExams);

// Get exam by ID
router.get('/:id', isAuthenticated, getExamById);

// Get all exams (public, no authentication required)
router.get('/public', async (req, res) => {
  try {
    const [exams] = await db.query('SELECT * FROM exams WHERE is_public = 1');
    res.json(exams);
  } catch (err) {
    console.error('Error fetching exams:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

// Get a single exam by ID
router.get('/public/:id', async (req, res) => {
  try {
    const [exam] = await db.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    
    if (exam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    res.json(exam[0]);
  } catch (err) {
    console.error('Error fetching exam:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

// Save an exam score (requires authentication)
router.post('/scores', verifyToken, async (req, res) => {
  try {
    const { examId, examTitle, score, timeTaken } = req.body;
    const userId = req.user.userId;
    
    // Validate required fields
    if (!examId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Insert score into database
    const [result] = await db.query(
      `INSERT INTO exam_scores (user_id, exam_id, exam_title, score, date_taken, time_taken, status) 
       VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [userId, examId, examTitle, score, timeTaken || 0, score >= 50 ? 'Passed' : 'Failed']
    );
    
    res.status(201).json({
      message: 'Score saved successfully',
      scoreId: result.insertId
    });
  } catch (err) {
    console.error('Error saving exam score:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

// Get scores for the current user (requires authentication)
router.get('/scores/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch scores from database
    const [scores] = await db.query(
      `SELECT 
        id, 
        exam_id AS examId, 
        exam_title AS examTitle, 
        score, 
        date_taken AS dateTaken, 
        time_taken AS timeTaken, 
        status 
       FROM exam_scores 
       WHERE user_id = ? 
       ORDER BY date_taken DESC`,
      [userId]
    );
    
    res.json(scores);
  } catch (err) {
    console.error('Error fetching exam scores:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

module.exports = router;
