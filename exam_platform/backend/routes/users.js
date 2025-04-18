/**
 * User Routes
 * Handles all user-related API endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// JWT verification middleware using the existing JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify token - using what's already in the auth system
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

// Get all users (unprotected for development)
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, full_name, email, filiere AS field, semester FROM users');
    
    // Add first_name derived from full_name
    const usersWithFirstName = results.map(user => ({
      ...user,
      first_name: user.full_name.split(' ')[0]
    }));

    res.json(usersWithFirstName);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

// Get currently logged-in user (protected)
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Get user ID from the JWT token data
    const userId = req.user.userId;
    
    // Fetch the user from database to get the most up-to-date information
    const [results] = await db.query(
      'SELECT id, full_name, email, filiere AS field, semester FROM users WHERE id = ?', 
      [userId]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add first_name derived from full_name
    const user = {
      ...results[0],
      first_name: results[0].full_name.split(' ')[0]
    };

    res.json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, full_name, email, filiere AS field, semester FROM users WHERE id = ?', 
      [req.params.id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add first_name derived from full_name
    const user = {
      ...results[0],
      first_name: results[0].full_name.split(' ')[0]
    };

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
  }
});

module.exports = router; 