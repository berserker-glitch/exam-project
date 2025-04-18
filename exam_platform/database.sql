-- Create the database
CREATE DATABASE IF NOT EXISTS exam_platform;
USE exam_platform;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex ENUM('male', 'female') NOT NULL,
    filiere ENUM('sma', 'smi', 'bcg', 'spa') NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sessions table with proper token size
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token TEXT NOT NULL,    -- Using TEXT for large tokens
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create exam scores table
CREATE TABLE IF NOT EXISTS exam_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    exam_id VARCHAR(100) NOT NULL,
    exam_title VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    date_taken TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_taken INT DEFAULT 0,       -- Time taken in seconds
    status ENUM('Passed', 'Failed') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_session_token ON sessions(session_token(255));
CREATE INDEX idx_expires_at ON sessions(expires_at);
CREATE INDEX idx_user_id ON exam_scores(user_id);
CREATE INDEX idx_exam_id ON exam_scores(exam_id);

-- Sample insert query for testing (password: Test@123)
INSERT INTO users (full_name, email, password_hash, date_of_birth, sex, filiere, semester)
VALUES (
    'Test User',
    'test@example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '2000-01-01',
    'male',
    'smi',
    2
);
