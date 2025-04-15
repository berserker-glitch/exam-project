/**
 * Exams Management Module
 * 
 * This module handles the listing and management of exams, including:
 * - Loading and displaying exams
 * - Filtering exams by year, semester, and group
 * - Managing exam actions (view, edit, delete)
 * - State management for exam list
 * 
 * Features:
 * - Dynamic filtering
 * - Real-time updates
 * - Error handling
 * - Loading states
 * 
 * @module ExamsManagement
 */

// State management for exam list and filters
let currentExams = [];
let filters = {
    year: '',
    semester: '',
    group: ''
};

/**
 * Initializes the exams page
 * Sets up event listeners and loads initial data
 */
document.addEventListener('DOMContentLoaded', () => {
    loadExams();
    setupFilterListeners();
});

/**
 * Sets up event listeners for filter controls
 * Updates filter state when user changes selections
 */
function setupFilterListeners() {
    document.getElementById('yearFilter').addEventListener('change', (e) => {
        filters.year = e.target.value;
    });

    document.getElementById('semesterFilter').addEventListener('change', (e) => {
        filters.semester = e.target.value;
    });

    document.getElementById('groupFilter').addEventListener('input', (e) => {
        filters.group = e.target.value;
    });
}

/**
 * Loads exams from the server based on current filters
 * 
 * Process:
 * 1. Shows loading spinner
 * 2. Builds query parameters from filters
 * 3. Fetches filtered exams from API
 * 4. Updates UI with results
 * 5. Handles any errors
 */
async function loadExams() {
    try {
        showLoading(true);
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.year) queryParams.append('year', filters.year);
        if (filters.semester) queryParams.append('semester', filters.semester);
        if (filters.group) queryParams.append('group', filters.group);
        
        const response = await fetch(`/api/exams?${queryParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            currentExams = data.exams;
            renderExams(currentExams);
        } else {
            throw new Error(data.message || 'Failed to load exams');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        showError('Failed to load exams. Please try again later.');
    } finally {
        showLoading(false);
    }
}

/**
 * Renders the exam list to the page
 * 
 * Handles:
 * - Empty state display
 * - Creating exam cards
 * - Updating DOM
 * 
 * @param {Array} exams - Array of exam objects to display
 */
function renderExams(exams) {
    const examsList = document.getElementById('examsList');
    const noExamsMessage = document.getElementById('noExamsMessage');
    
    if (!exams || exams.length === 0) {
        examsList.innerHTML = '';
        noExamsMessage.style.display = 'block';
        return;
    }
    
    noExamsMessage.style.display = 'none';
    examsList.innerHTML = '';
    
    exams.forEach(exam => {
        const examElement = createExamElement(exam);
        examsList.appendChild(examElement);
    });
}

/**
 * Creates an exam card element from template
 * 
 * Populates:
 * - Title and description
 * - Target audience badges
 * - Question count
 * - Creation date
 * - Action buttons
 * 
 * @param {Object} exam - Exam data object
 * @returns {HTMLElement} The created exam card element
 */
function createExamElement(exam) {
    const template = document.getElementById('examTemplate');
    const examElement = template.content.cloneNode(true);
    const examCard = examElement.querySelector('.exam-card');
    
    // Set exam data
    examCard.querySelector('.exam-title').textContent = exam.title;
    examCard.querySelector('.exam-description').textContent = exam.description || 'No description provided';
    examCard.querySelector('.year-badge').textContent = `Year ${exam.target_year}`;
    examCard.querySelector('.semester-badge').textContent = exam.target_semester;
    if (exam.target_group) {
        examCard.querySelector('.group-badge').textContent = exam.target_group;
    } else {
        examCard.querySelector('.group-badge').style.display = 'none';
    }
    
    // Set question count
    examCard.querySelector('.question-count .count').textContent = 
        exam.questions ? exam.questions.length : 0;
    
    // Format and set creation date
    const createdDate = new Date(exam.created_at).toLocaleDateString();
    examCard.querySelector('.created-date .date').textContent = createdDate;
    
    // Set action button data attributes
    const buttons = examCard.querySelectorAll('.exam-actions button');
    buttons.forEach(button => button.dataset.examId = exam.id);
    
    return examCard;
}

/**
 * Applies current filters and reloads exams
 */
function applyFilters() {
    loadExams();
}

/**
 * Shows or hides the loading spinner
 * @param {boolean} show - Whether to show the spinner
 */
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

/**
 * Displays an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    alert(message); // You can replace this with a better error display mechanism
}

/**
 * Navigates to the exam view page
 * @param {string} examId - ID of the exam to view
 */
async function viewExam(examId) {
    window.location.href = `/exam.html?id=${examId}`;
}

/**
 * Navigates to the exam edit page
 * @param {string} examId - ID of the exam to edit
 */
async function editExam(examId) {
    window.location.href = `/create_exam.html?edit=${examId}`;
}

/**
 * Deletes an exam after confirmation
 * 
 * Process:
 * 1. Shows confirmation dialog
 * 2. Sends delete request to API
 * 3. Updates UI on success
 * 4. Handles errors
 * 
 * @param {string} examId - ID of the exam to delete
 */
async function deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/exams/${examId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from current exams and re-render
            currentExams = currentExams.filter(exam => exam.id !== examId);
            renderExams(currentExams);
        } else {
            throw new Error(result.message || 'Failed to delete exam');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        showError('Failed to delete exam. Please try again later.');
    }
} 