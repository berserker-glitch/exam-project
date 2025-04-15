/**
 * Database Configuration Module
 * 
 * This module handles the MySQL database connection and pool management.
 * It provides a connection pool for better performance and resource management.
 * 
 * Features:
 * - Connection pooling for efficient resource usage
 * - Error handling for common database connection issues
 * - Automatic reconnection on connection loss
 * - Promise-based interface for async/await support
 * 
 * Configuration:
 * - Host: localhost
 * - User: exam_user
 * - Database: exam_platform
 * - Connection Limit: 10
 * - Queue Limit: Unlimited (0)
 */

const mysql = require('mysql2');

console.log('Initializing database connection pool...');

// Create a connection pool for better performance and connection management
const pool = mysql.createPool({
    host: 'localhost',      // Database host
    user: 'exam_user',     // Database user
    password: 'yasserMBA123#',      // Database password
    database: 'exam_platform', // Database name
    waitForConnections: true,  // Queue connections when pool is full
    connectionLimit: 10,       // Maximum number of connections to create at once
    queueLimit: 0,            // Maximum number of connection requests to queue (0 = unlimited)
    ssl: false,               // Disable SSL for local development
    authSwitch: true          // Enable authentication method switching
});

/**
 * Connection Error Handler
 * 
 * Tests the database connection and handles various connection errors:
 * - PROTOCOL_CONNECTION_LOST: Connection to the MySQL server was lost
 * - ER_CON_COUNT_ERROR: Too many connections
 * - ECONNREFUSED: Server refused the connection
 * - ER_BAD_DB_ERROR: Database does not exist
 * - AUTH_SWITCH_PLUGIN_ERROR: Authentication plugin incompatibility
 */
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database Connection Error:', {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState,
            fatal: err.fatal
        });

        // Handle specific connection errors with descriptive messages
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist.');
        }
        if (err.code === 'AUTH_SWITCH_PLUGIN_ERROR') {
            console.error('Authentication plugin error - please check MySQL user settings.');
        }
        return;
    }
    if (connection) {
        console.log('Successfully connected to the database.');
        // Test query to verify full functionality
        connection.query('SELECT 1', (error, results) => {
            if (error) {
                console.error('Test query failed:', error);
            } else {
                console.log('Test query successful:', results);
            }
            connection.release();
        });
    }
});

// Convert the pool to use promises for async/await support
const promisePool = pool.promise();

module.exports = promisePool;
