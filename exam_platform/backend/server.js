/**
 * Main server configuration file for the Exam Platform
 * Sets up Express server with necessary middleware and routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const examRoutes = require('./routes/exams');

const app = express();

// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount authentication routes under /api/auth
app.use('/api/auth', authRoutes);

// Mount user routes under /api/users
app.use('/api/users', userRoutes);

// Mount exam routes under /api/exams
app.use('/api/exams', examRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n Server is running on port ${PORT}`);
    console.log(`   Homepage: http://localhost:${PORT}/views/index.html`);
    console.log(`   Sign up: http://localhost:${PORT}/views/signup.html`);
    console.log(`   Login: http://localhost:${PORT}/views/login.html`);

});
