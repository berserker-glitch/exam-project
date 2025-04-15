/**
 * Main server configuration file for the Exam Platform
 * Sets up Express server with necessary middleware and routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();

// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount authentication routes under /api/auth
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log('\n📱 Access the application at:');
    console.log(`   Homepage: http://localhost:${PORT}/views/index.html`);
    console.log(`   API Endpoint: http://localhost:${PORT}/api`);
    console.log('\n✨ You can now:');
    console.log(`   1. Sign up: http://localhost:${PORT}/views/signup.html`);
    console.log(`   2. Login: http://localhost:${PORT}/views/login.html`);
    console.log('\n📝 API Documentation:');
    console.log('   POST /api/auth/register - Register a new user');
    console.log('   POST /api/auth/login - Login user');
    console.log('   POST /api/auth/logout - Logout user\n');
});
