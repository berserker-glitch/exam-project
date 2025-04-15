const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamById } = require('../controllers/exams');
const { isAuthenticated } = require('../middleware/auth');

// Create a new exam (protected route)
router.post('/', isAuthenticated, createExam);

// Get all exams (with optional filters)
router.get('/', isAuthenticated, getExams);

// Get exam by ID
router.get('/:id', isAuthenticated, getExamById);

module.exports = router;
