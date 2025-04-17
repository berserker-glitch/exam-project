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
    const storedUser = localStorage.getItem('currentUser');
    
    if (token && storedUser) {
        try {
            // TEMPORARY: Skip token verification since backend API is not yet implemented
            // Just use the stored user data
            currentUser = JSON.parse(storedUser);
            updateUIForAuthenticatedUser();
            
            // Uncomment once backend is ready
            /*
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                updateUIForAuthenticatedUser();
            } else {
                // Token invalid, clear and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                redirectToLogin();
            }
            */
        } catch (error) {
            console.error('Auth verification failed:', error);
            // Continue as if logged in for development purposes
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                updateUIForAuthenticatedUser();
            } else {
                redirectToLogin();
            }
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
        userNameElement.textContent = currentUser.name || 'User';
    }
    
    // Update user info if elements exist
    const userFieldElement = document.getElementById('userField');
    if (userFieldElement && currentUser) {
        userFieldElement.textContent = currentUser.field || 'Not specified';
    }
    
    const userYearElement = document.getElementById('userYear');
    if (userYearElement && currentUser) {
        userYearElement.textContent = currentUser.year || 'Not specified';
    }
}

// Initialize dashboard
function initializeDashboard() {
    fetchUserExamScores();
}

// Fetch user exam scores
async function fetchUserExamScores() {
    try {
        // Get the current user ID to isolate scores
        const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUserData.email || '';
        
        if (!userId) {
            console.warn('No user ID found, cannot fetch scores');
            return;
        }
        
        // TEMPORARY FALLBACK: Fetch from localStorage since backend API is not yet implemented
        // First try the new format (user-specific scores)
        const allUserScores = JSON.parse(localStorage.getItem('allUserScores') || '{}');
        
        if (allUserScores[userId]) {
            // We found user-specific scores, use them
            displayExamScores(allUserScores[userId]);
            return;
        }
        
        // Fall back to the old format, but filter by user ID
        const userScores = JSON.parse(localStorage.getItem('userScores') || '[]');
        const filteredScores = userScores.filter(score => score.userId === userId);
        displayExamScores(filteredScores);
        
        // Skip the API call for now
        
        // Uncomment this block once the backend API is ready
        /*
        const response = await fetch('/api/exams/scores', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const scores = await response.json();
            displayExamScores(scores);
        } else {
            console.error('Failed to fetch exam scores');
        }
        */
    } catch (error) {
        console.error('Error fetching user exam scores:', error);
    }
}

// Display exam scores in the table
function displayExamScores(scores) {
    console.log('Displaying scores:', scores);
    const tableBody = document.querySelector('#examScoresTable tbody');
    if (!tableBody) {
        console.error('Exam scores table body not found in the DOM');
        return;
    }
    
    if (!Array.isArray(scores)) {
        console.error('Invalid scores data:', scores);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-scores">Error: Invalid score data</td>
            </tr>
        `;
        return;
    }
    
    if (scores.length === 0) {
        console.log('No scores available to display');
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-scores">No exam scores available yet.</td>
            </tr>
        `;
        return;
    }
    
    // Log the current user for debugging
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Current user:', currentUserData);
    
    tableBody.innerHTML = '';
    scores.forEach(score => {
        try {
            const row = document.createElement('tr');
            
            // Format the date
            let dateTaken = 'Unknown';
            try {
                dateTaken = new Date(score.dateTaken).toLocaleDateString();
            } catch (e) {
                console.error('Error formatting date:', e, score.dateTaken);
            }
            
            // Determine status based on score
            let status = '';
            let statusClass = '';
            
            if (score.score >= 80) {
                status = 'Excellent';
                statusClass = 'status-excellent';
            } else if (score.score >= 60) {
                status = 'Good';
                statusClass = 'status-good';
            } else if (score.score >= 40) {
                status = 'Average';
                statusClass = 'status-average';
            } else {
                status = 'Needs Improvement';
                statusClass = 'status-needs-improvement';
            }
            
            row.innerHTML = `
                <td>${score.examName || 'Unnamed Exam'}</td>
                <td>${score.score || 0}%</td>
                <td>${dateTaken}</td>
                <td class="${statusClass}">${status}</td>
            `;
            
            tableBody.appendChild(row);
        } catch (error) {
            console.error('Error displaying score row:', error, score);
        }
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
        // TEMPORARY: Mock login for development
        // Store token and user data
        const token = "mock_token_" + Date.now();
        const user = {
            name: email.split('@')[0],
            email: email,
            field: "Computer Science",
            year: "2nd Year"
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect to dashboard
        redirectToDashboard();
        
        return false;
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login. Please try again.');
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

        const data = await response.json();

        if (!response.ok) {
            if (data.missing) {
                alert(`Missing required fields: ${data.missing.join(', ')}`);
            } else if (data.error === 'ER_NO_SUCH_TABLE') {
                alert('Database setup required. Please contact administrator.');
            } else {
                alert(data.message || 'Registration failed');
            }
            return false;
        }

        alert('Registration successful! Please login with your credentials.');
        window.location.href = 'views/login.html';
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
