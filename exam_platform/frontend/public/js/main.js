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
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Login failed');
            return false;
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
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
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error during registration. Please try again or contact support if the problem persists.');
    }
    return false;
}

/**
 * Dashboard Initialization
 * 
 * Sets up the dashboard page:
 * 1. Checks for valid session
 * 2. Redirects to login if no session
 * 3. Updates UI with user information
 */
async function initializeDashboard() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // Update dashboard with user info
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userField').textContent = user.filiere.toUpperCase();
    document.getElementById('userYear').textContent = `Semester ${user.semester}`;
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
    window.location.href = 'login.html';
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
    const container = document.getElementById(inputId).parentElement;
    const input = document.getElementById(inputId);
    
    container.classList.toggle('show-password');
    input.type = input.type === 'password' ? 'text' : 'password';
}
