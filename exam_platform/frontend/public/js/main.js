/**
 * Main JavaScript Module
 * 
 * This module handles all client-side functionality including:
 * - User authentication (login/signup)
 * - Form validation
 * - Password strength checking
 * - Dashboard initialization
 * - API communication
 * - Session management
 * 
 * API Integration:
 * - Uses fetch API for HTTP requests
 * - Handles JWT token-based authentication
 * - Manages user session storage
 * 
 * Security Features:
 * - Client-side input validation
 * - Password strength requirements
 * - Secure token storage
 * - Session management
 */

const API_URL = 'http://localhost:3000/api';

// Mock database for frontend demonstration (in real app, this would be server-side)
const mockDatabase = {
    users: [
        {
            email: 'test@example.com',
            password_hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Test@123
            full_name: 'Test User',
            filiere: 'smi',
            semester: 2
        }
    ]
};

// Main.js - Core functionality for the Exam Platform

// Global variables
let currentUser = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    checkAuth();
    
    // Initialize dashboard if on dashboard page
    if (document.querySelector('.dashboard-container')) {
        initializeDashboard();
    }
    
    // Add logout handler
    const logoutBtn = document.querySelector('.logout-link');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Check authentication state
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // Use token to fetch current user data
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Authentication failed');
            }
            
            // Get the latest user data
            const userData = await response.json();
            currentUser = userData;
            
            // Update stored user data
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            updateUIForAuthenticatedUser();
        } catch (error) {
            console.error('Auth verification failed:', error);
            // Auth failed, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            redirectToLogin();
        }
    } else {
        // No token, redirect to login page if not already there
        const currentPath = window.location.pathname;
        if (!isPublicPage(currentPath)) {
            redirectToLogin();
        }
    }
}

// Check if current page is a public page (login, signup, index)
function isPublicPage(path) {
    const publicPages = [
        '/login.html', 
        '/signup.html', 
        '/index.html', 
        '/views/login.html', 
        '/views/signup.html', 
        '/views/index.html'
    ];
    
    return publicPages.some(page => path.endsWith(page));
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    // Update username display if element exists
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.first_name || currentUser.full_name.split(' ')[0] || 'User';
    }
    
    // Update user info if elements exist
    const userFieldElement = document.getElementById('userField');
    if (userFieldElement && currentUser) {
        // Convert field code to proper name
        const fieldName = getFieldName(currentUser.field || 'Not specified');
        userFieldElement.textContent = fieldName;
    }
    
    const userSemesterElement = document.getElementById('userSemester');
    if (userSemesterElement && currentUser) {
        // If semester is available, use it
        if (currentUser.semester) {
            userSemesterElement.textContent = `Semester ${currentUser.semester}`;
        } 
        // For backward compatibility
        else if (currentUser.year) {
            userSemesterElement.textContent = `Semester ${currentUser.year}`;
        } 
        else {
            userSemesterElement.textContent = 'Not specified';
        }
    }
    
    // Update email if that element exists
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && currentUser) {
        userEmailElement.textContent = currentUser.email || 'Not specified';
    }
}

// Helper function to convert field code to full name
function getFieldName(fieldCode) {
    const fieldMap = {
        'smi': 'Computer Science',
        'sma': 'Mathematics',
        'bcg': 'Biology & Geology',
        'spa': 'Physics'
    };
    
    return fieldMap[fieldCode.toLowerCase()] || fieldCode;
}

// Initialize dashboard
function initializeDashboard() {
    fetchUserExamScores();
}

// Fetch user exam scores
function fetchUserExamScores() {
    const userId = localStorage.getItem('userEmail');
    if (!userId) {
        console.error('No user email found in localStorage');
        return [];
    }

    // Get token for authentication
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found, using localStorage as fallback');

        // Try using the new user-specific format first
        const allUserScores = JSON.parse(localStorage.getItem('allUserScores') || '{}');
        const userScores = allUserScores[userId] || [];
        
        if (userScores.length > 0) {
            return userScores;
        }
        
        // Fall back to the old format if no user-specific scores found
        // Filter scores that belong to the current user
        const oldFormatScores = JSON.parse(localStorage.getItem('userScores') || '[]');
        return oldFormatScores.filter(score => score.userId === userId || !score.userId);
    }

    // Attempt to fetch from server first
    return fetch('/api/exams/scores', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch scores from server');
        }
        return response.json();
    })
    .then(data => {
        return data.scores || [];
    })
    .catch(error => {
        console.error('Error fetching scores from server:', error);
        
        // Fallback to localStorage if server request fails
        const allUserScores = JSON.parse(localStorage.getItem('allUserScores') || '{}');
        const userScores = allUserScores[userId] || [];
        
        if (userScores.length > 0) {
            return userScores;
        }
        
        // Fall back to the old format if needed
        const oldFormatScores = JSON.parse(localStorage.getItem('userScores') || '[]');
        return oldFormatScores.filter(score => score.userId === userId || !score.userId);
    });
}

// Display exam scores in the table
function displayExamScores(scores) {
    const tableBody = document.getElementById('exam-scores-body');
    const noScoresMessage = document.getElementById('no-scores-message');
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        // Show empty state message
        if (noScoresMessage) {
            noScoresMessage.style.display = 'flex';
        }
        return;
    }
    
    // Hide empty state message if there are scores
    if (noScoresMessage) {
        noScoresMessage.style.display = 'none';
    }
    
    // Sort scores by date (most recent first)
    scores.sort((a, b) => {
        return new Date(b.dateTaken) - new Date(a.dateTaken);
    });
    
    // Add each score to the table
    scores.forEach(score => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(score.dateTaken);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Determine status class for styling
        const statusClass = score.score >= 50 ? 'status-passed' : 'status-failed';
        const status = score.score >= 50 ? 'Passed' : 'Failed';
        
        // Format time taken
        let timeTaken = '';
        if (score.timeTaken) {
            const minutes = Math.floor(score.timeTaken / 60);
            const seconds = score.timeTaken % 60;
            timeTaken = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
        }
        
        row.innerHTML = `
            <td>
                <div class="exam-title">${score.examTitle || 'Untitled Exam'}</div>
            </td>
            <td>
                <div class="score-cell">
                    <div class="score-bubble ${getScoreClass(score.score)}">
                        ${score.score}%
                    </div>
                </div>
            </td>
            <td>${formattedDate}</td>
            <td>${timeTaken}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Logout function
function logout(event) {
    if (event) event.preventDefault();
    
    // Check if this function is being called from the dashboard
    // If so, we'll let the direct implementation in dashboard.html handle it
    const currentPath = window.location.pathname;
    if (currentPath.includes('/dashboard.html')) {
        console.log('Logout handled directly by dashboard.html');
        return; // Exit early and let dashboard.html handle logout
    }
    
    // For other pages, clear storage and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('allUserScores');
    
    // Direct path construction based on current location
    if (currentPath.includes('/views/')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'views/login.html';
    }
}

// Get base path for URL construction
function getBasePath() {
    const path = window.location.pathname;
    
    // Check if we're already in the /views/ directory by looking for /views/ in the path
    if (path.includes('/views/')) {
        // If we're in views already, don't add views again
        return '';
    } else {
        // If we're not in views, add it
        return 'views/';
    }
}

// Redirect to login page
function redirectToLogin() {
    const basePath = getBasePath();
    window.location.href = `${basePath}login.html`;
}

// Redirect to dashboard page
function redirectToDashboard() {
    const basePath = getBasePath();
    window.location.href = `${basePath}dashboard.html`;
}

/**
 * Login Form Validation and Submission
 * 
 * Validates user credentials and handles login process:
 * 1. Validates email format
 * 2. Ensures password is provided
 * 3. Sends login request to API
 * 4. Stores JWT token and user data
 * 5. Redirects to dashboard on success
 * 
 * @param {Event} event - Form submission event
 * @returns {boolean} False to prevent form submission
 */
async function validateLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    try {
        // Send real login request to the API
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
        
        const data = await response.json();
        
        // Store the JWT token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Redirect to dashboard
        redirectToDashboard();
        
        return false;
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
    return false;
}

/**
 * Password Strength Checker
 * 
 * Validates password against security requirements:
 * - Minimum 8 characters
 * - Contains lowercase letter
 * - Contains uppercase letter
 * - Contains number
 * - Contains special character
 * 
 * Updates UI to show which requirements are met
 * 
 * @param {string} password - Password to check
 */
function checkPassword(password) {
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    for (const [requirement, met] of Object.entries(requirements)) {
        const element = document.getElementById(requirement);
        if (met) {
            element.style.color = '#4CAF50';
            element.style.textDecoration = 'line-through';
        } else {
            element.style.color = '#b3b3b3';
            element.style.textDecoration = 'none';
        }
    }
}

/**
 * Signup Form Validation and Submission
 * 
 * Validates user input and handles registration process:
 * 1. Validates all required fields
 * 2. Checks email format
 * 3. Validates age requirement
 * 4. Checks password strength
 * 5. Verifies password confirmation
 * 6. Submits registration to API
 * 
 * @param {Event} event - Form submission event
 * @returns {boolean} False to prevent form submission
 */
async function validateSignup(event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const dob = document.getElementById('dob').value;
    const sex = document.getElementById('sex').value;
    const filiere = document.getElementById('filiere').value;
    const studyYear = document.getElementById('studyYear').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic validation
    if (!fullName || !email || !dob || !sex || !filiere || !studyYear || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    // Date of Birth validation
    const dobDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (age < 16) {
        alert('You must be at least 16 years old to register');
        return false;
    }

    // Password validation
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Password does not meet requirements');
        return false;
    }

    // Confirm password
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return false;
    }

    try {
        // Try to register the user
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password,
                date_of_birth: dob,
                sex,
                filiere,
                semester: parseInt(studyYear)
            })
        });

        if (!response.ok) {
            const data = await response.json();
            if (data.missing) {
                alert(`Missing required fields: ${data.missing.join(', ')}`);
            } else if (data.error === 'ER_NO_SUCH_TABLE') {
                alert('Database setup required. Please contact administrator.');
            } else {
                alert(data.message || 'Registration failed');
            }
            return false;
        }

        // Registration successful, now login
        // For development, fetch user data from API
        const usersResponse = await fetch('/api/users');
        
        if (!usersResponse.ok) {
            throw new Error('Failed to fetch user data after registration');
        }
        
        const users = await usersResponse.json();
        
        // We'll use the first user for development
        // In production, the registration or login would return the specific user
        const dbUser = users.length > 0 ? users[0] : null;
        
        if (!dbUser) {
            throw new Error('No users found in database after registration');
        }
        
        // Store token and user data
        const token = "mock_token_" + Date.now();
        
        // Use the database user data but keep the entered email
        const user = {
            full_name: dbUser.full_name,
            first_name: dbUser.first_name, 
            email: email, // Keep the email the user entered
            field: dbUser.field,
            semester: dbUser.semester
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect to dashboard
        redirectToDashboard();
        
        return false;
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error during registration. Please try again or contact support if the problem persists.');
    }
    return false;
}

/**
 * User Logout
 * 
 * Handles the logout process:
 * 1. Calls logout API endpoint
 * 2. Clears local storage
 * 3. Redirects to login page
 */
async function logout() {
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear local storage and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'views/login.html';
}

// Initialize dashboard if we're on the dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    initializeDashboard();
}

/**
 * Password Visibility Toggle
 * 
 * Toggles password field visibility between text and password
 * 
 * @param {string} inputId - ID of the password input field
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.type = input.type === 'password' ? 'text' : 'password';
    
    // Toggle icon if present
    const container = input.parentElement;
    if (container) {
        container.classList.toggle('show-password');
    }
}

/* 
 * Helper function to get score class based on score value
 */
function getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-great';
    if (score >= 70) return 'score-good';
    if (score >= 60) return 'score-fair';
    if (score >= 50) return 'score-pass';
    return 'score-fail';
}
