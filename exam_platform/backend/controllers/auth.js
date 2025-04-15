/**
 * Authentication Controller
 * 
 * This module handles all authentication-related functionality including:
 * - User registration with input validation
 * - User login with JWT token generation
 * - Session management
 * - Logout functionality
 * 
 * Security Features:
 * - Password hashing using bcrypt
 * - JWT token-based authentication
 * - Session tracking in database
 * - Input validation and sanitization
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * User Registration Handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user details
 * @param {string} req.body.full_name - User's full name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (will be hashed)
 * @param {string} req.body.date_of_birth - User's date of birth
 * @param {string} req.body.sex - User's gender (male/female/other)
 * @param {string} req.body.filiere - User's academic program
 * @param {number} req.body.semester - User's current semester
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with registration status
 */
exports.register = async (req, res) => {
    try {
        console.log('Received registration request:', req.body);
        
        const {
            full_name,
            email,
            password,
            date_of_birth,
            sex,
            filiere,
            semester
        } = req.body;

        console.log('Registration attempt:', { 
            full_name, 
            email, 
            date_of_birth, 
            sex, 
            filiere, 
            semester 
        });

        // Validate required fields
        if (!full_name || !email || !password || !date_of_birth || !sex || !filiere || !semester) {
            console.log('Missing fields:', { 
                full_name: !!full_name, 
                email: !!email, 
                password: !!password, 
                date_of_birth: !!date_of_birth, 
                sex: !!sex, 
                filiere: !!filiere, 
                semester: !!semester 
            });
            return res.status(400).json({
                message: 'Missing required fields',
                missing: Object.entries({ full_name, email, password, date_of_birth, sex, filiere, semester })
                    .filter(([_, value]) => !value)
                    .map(([key]) => key)
            });
        }

        try {
            // Check if user already exists
            console.log('Checking for existing user with email:', email);
            const [existingUsers] = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                console.log('User already exists with email:', email);
                return res.status(400).json({ message: 'Email already registered' });
            }

            // Hash password using bcrypt with 10 rounds of salting
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user into database
            console.log('Attempting to insert new user...');
            const [result] = await db.query(
                `INSERT INTO users (full_name, email, password_hash, date_of_birth, sex, filiere, semester)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [full_name, email, hashedPassword, date_of_birth, sex, filiere, semester]
            );

            console.log('User registered successfully:', result.insertId);
            res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId
            });
        } catch (dbError) {
            console.error('Database error during registration:', {
                code: dbError.code,
                errno: dbError.errno,
                sqlMessage: dbError.sqlMessage,
                sql: dbError.sql
            });
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                return res.status(500).json({ 
                    message: 'Database table not found. Please ensure the database is properly set up.',
                    error: 'ER_NO_SUCH_TABLE'
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        res.status(500).json({ 
            message: 'Error registering user',
            error: error.message,
            details: {
                code: error.code,
                sqlMessage: error.sqlMessage
            }
        });
    }
};

/**
 * User Login Handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with login status and JWT token
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password using bcrypt
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token with user information
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                full_name: user.full_name,
                filiere: user.filiere,
                semester: user.semester
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create session record in database
        await db.query(
            `INSERT INTO sessions (user_id, session_token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
            [user.id, token]
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                filiere: user.filiere,
                semester: user.semester
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
};

/**
 * User Logout Handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers containing authorization token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with logout status
 */
exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            // Remove session from database
            await db.query('DELETE FROM sessions WHERE session_token = ?', [token]);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error during logout' });
    }
};
