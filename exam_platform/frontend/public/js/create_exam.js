/**
 * Exam Creation Module
 * 
 * This module handles the creation and management of exams, including:
 * - Dynamic question addition (MCQ and direct questions)
 * - Question management (add, edit, delete)
 * - Form validation
 * - Data collection and submission
 * - Preview functionality
 * 
 * Features:
 * - Supports multiple question types (MCQ, direct answer)
 * - Dynamic form validation
 * - Real-time question numbering
 * - Flexible question management
 * 
 * @module ExamCreation
 */

// Get DOM elements
const examForm = document.getElementById('examCreationForm');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const questionTypeModal = document.getElementById('questionTypeModal');
const closeModalBtn = document.getElementById('closeQuestionTypeModal');
const questionCreationModal = document.getElementById('questionCreationModal');
const cancelQuestionBtn = document.getElementById('cancelQuestionBtn');
const questionForm = document.getElementById('questionForm');
const questionContainer = document.getElementById('questionContainer');

// Event listeners
examForm.addEventListener('submit', handleExamSubmit);
addQuestionBtn.addEventListener('click', openQuestionTypeModal);
closeModalBtn.addEventListener('click', closeQuestionTypeModal);
questionTypeModal.addEventListener('click', selectQuestionType);
cancelQuestionBtn.addEventListener('click', closeQuestionCreationModal);
questionForm.addEventListener('submit', handleQuestionSubmit);

// Global variables
let examData = {
    name: '',
    semester: '',
    group: '',
    questions: []
};

// Handle exam form submission
async function handleExamSubmit(event) {
    event.preventDefault();

    const examName = document.getElementById('examName').value.trim();
    const targetSemester = document.getElementById('targetSemester').value.trim();
    const targetGroup = document.getElementById('targetGroup').value.trim();

    if (!validateExamDetails(examName, targetSemester)) {
        return;
    }

    examData.name = examName;
    examData.semester = targetSemester;
    examData.group = targetGroup;
    
    // Generate a UUID for the exam
    const examId = generateUUID();
    examData.id = examId;

    try {
        // TEMPORARY FALLBACK: Save to localStorage since backend API is not yet implemented
        // Remove this block once the backend API is ready
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        examData.createdAt = new Date().toISOString();
        exams.push(examData);
        localStorage.setItem('exams', JSON.stringify(exams));
        console.log('Exam saved to localStorage temporarily:', examData);
        showSuccessMessage('Exam created successfully! (Saved locally)');
        displayExamLink(examId);
        resetForm();
        return; // Skip the API call for now
        
        // Uncomment this block once the backend API is ready
        /*
        const response = await fetch('/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(examData)
        });

        if (response.ok) {
            showSuccessMessage('Exam created successfully!');
            // Display the exam link to share with students
            displayExamLink(examId);
            resetForm();
        } else {
            const errorData = await response.json();
            showErrorMessage(`Failed to create exam: ${errorData.message}`);
        }
        */
    } catch (error) {
        console.error('Error creating exam:', error);
        showErrorMessage('An error occurred while creating the exam. Please try again.');
    }
}

// Validate exam details
function validateExamDetails(examName, targetSemester) {
    if (examName === '') {
        showErrorMessage('Please enter an exam name.');
        return false;
    }

    if (targetSemester === '') {
        showErrorMessage('Please enter a target semester.');
        return false;
    }

    return true;
}

// Open question type modal
function openQuestionTypeModal() {
    questionTypeModal.style.display = 'block';
}

// Close question type modal
function closeQuestionTypeModal() {
    questionTypeModal.style.display = 'none';
}

// Select question type
function selectQuestionType(event) {
    if (event.target.classList.contains('question-type-btn')) {
        const questionType = event.target.dataset.type;
        openQuestionCreationModal(questionType);
        closeQuestionTypeModal();
    }
}

// Open question creation modal
function openQuestionCreationModal(questionType) {
    questionCreationModal.style.display = 'block';
    questionForm.dataset.questionType = questionType;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    if (questionType === 'mcq') {
        const optionInputs = `
            <label>Options</label>
            <div id="mcqOptions">
                <div class="mcq-option">
                    <input type="text" name="option1" placeholder="Option 1" required>
                    <button type="button" class="btn remove-option-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mcq-option">
                    <input type="text" name="option2" placeholder="Option 2" required>
                    <button type="button" class="btn remove-option-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <button type="button" class="btn add-option-btn" id="addOptionBtn">
                <i class="fas fa-plus"></i> Add Option
            </button>
        `;
        optionsContainer.innerHTML = optionInputs;

        const addOptionBtn = document.getElementById('addOptionBtn');
        addOptionBtn.addEventListener('click', addMCQOption);

        const removeOptionBtns = document.querySelectorAll('.remove-option-btn');
        removeOptionBtns.forEach(btn => {
            btn.addEventListener('click', removeMCQOption);
        });
    }
}

// Close question creation modal
function closeQuestionCreationModal() {
    questionCreationModal.style.display = 'none';
    questionForm.reset();
}

// Handle question form submission
async function handleQuestionSubmit(event) {
    event.preventDefault();

    const questionType = questionForm.dataset.questionType;
    const questionText = document.getElementById('questionText').value.trim();
    const correctAnswer = document.getElementById('correctAnswer').value.trim();
    const points = parseInt(document.getElementById('points').value);

    if (!validateQuestionDetails(questionText, correctAnswer, points)) {
        return;
    }

    const question = {
        type: questionType,
        text: questionText,
        correctAnswer: correctAnswer,
        points: points
    };

    if (questionType === 'mcq') {
        const options = [];
        const optionInputs = document.querySelectorAll('#mcqOptions input');
        optionInputs.forEach(input => {
            const optionText = input.value.trim();
            if (optionText !== '') {
                options.push(optionText);
            }
        });

        if (options.length < 2) {
            showErrorMessage('Please provide at least two options for MCQ questions.');
            return;
        }

        question.options = options;
    }

    examData.questions.push(question);
    displayQuestion(question);
    closeQuestionCreationModal();
    showSuccessMessage('Question added successfully!');
}

// Validate question details
function validateQuestionDetails(questionText, correctAnswer, points) {
    if (questionText === '') {
        showErrorMessage('Please enter the question text.');
        return false;
    }

    if (correctAnswer === '') {
        showErrorMessage('Please enter the correct answer.');
        return false;
    }

    if (isNaN(points) || points <= 0) {
        showErrorMessage('Please enter a valid positive number for points.');
        return false;
    }

    return true;
}

// Display question in the question container
function displayQuestion(question) {
    const questionElement = document.createElement('div');
    questionElement.classList.add('question-card');

    const questionHTML = `
        <div class="question-header">
            <h3>${question.text}</h3>
            <div class="question-actions">
                <button type="button" class="btn edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="question-details">
            <p><strong>Type:</strong> ${question.type}</p>
            <p><strong>Points:</strong> ${question.points}</p>
            ${question.type === 'mcq' ? `<p><strong>Options:</strong> ${question.options.join(', ')}</p>` : ''}
            <p><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
        </div>
    `;

    questionElement.innerHTML = questionHTML;
    questionContainer.appendChild(questionElement);
}

// Add MCQ option
function addMCQOption() {
    const mcqOptions = document.getElementById('mcqOptions');
    const newOption = document.createElement('div');
    newOption.classList.add('mcq-option');
    newOption.innerHTML = `
        <input type="text" name="option${mcqOptions.children.length + 1}" placeholder="Option ${mcqOptions.children.length + 1}" required>
        <button type="button" class="btn remove-option-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    mcqOptions.appendChild(newOption);

    const removeOptionBtn = newOption.querySelector('.remove-option-btn');
    removeOptionBtn.addEventListener('click', removeMCQOption);
}

// Remove MCQ option
function removeMCQOption(event) {
    const optionElement = event.target.closest('.mcq-option');
    optionElement.remove();
}

// Show success message
function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.classList.add('success-message');
    successMessage.textContent = message;
    document.body.appendChild(successMessage);

    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = message;
    document.body.appendChild(errorMessage);

    setTimeout(() => {
        errorMessage.remove();
    }, 3000);
}

// Reset form
function resetForm() {
    examForm.reset();
    questionContainer.innerHTML = '';
    examData = {
        name: '',
        semester: '',
        group: '',
        questions: []
    };
}

// Generate UUID for exam link
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Display exam link
function displayExamLink(examId) {
    // Create a modal to display the exam link
    const examLinkModal = document.createElement('div');
    examLinkModal.classList.add('modal');
    examLinkModal.style.display = 'block';
    
    // Generate the correct path to take_exam.html
    // Get the origin (http://domain.com)
    const origin = window.location.origin;
    // Construct the take_exam.html URL with the exam ID
    const examLink = `${origin}/views/take_exam.html?exam=${examId}`;
    
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    modalContent.innerHTML = `
        <h2>Exam Created Successfully</h2>
        <p>Your exam has been created. Share this link with your students:</p>
        <div class="exam-link-container">
            <input type="text" id="examLinkInput" value="${examLink}" readonly>
            <button class="btn" id="copyExamLink">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
        <button class="btn btn-primary" id="closeExamLinkModal">Done</button>
    `;
    
    examLinkModal.appendChild(modalContent);
    document.body.appendChild(examLinkModal);
    
    // Select the input text for easy copying
    const examLinkInput = document.getElementById('examLinkInput');
    examLinkInput.focus();
    examLinkInput.select();
    
    // Add event listeners
    document.getElementById('copyExamLink').addEventListener('click', function() {
        examLinkInput.select();
        document.execCommand('copy');
        showSuccessMessage('Exam link copied to clipboard');
    });
    
    document.getElementById('closeExamLinkModal').addEventListener('click', function() {
        examLinkModal.remove();
        // Redirect to dashboard after creating exam
        redirectToDashboard();
    });
}

// Redirect to dashboard
function redirectToDashboard() {
    const path = window.location.pathname;
    if (path.includes('/views/')) {
        window.location.href = './dashboard.html';
    } else {
        window.location.href = './views/dashboard.html';
    }
}

/**
 * Previews the exam before submission
 * Currently shows data in console and alerts user
 * TODO: Implement visual preview
 */
function previewExam() {
    const examData = collectExamData();
    console.log('Preview data:', examData);
    alert('Preview functionality to be implemented');
}

/**
 * Collects all exam data from the form
 * 
 * Gathers:
 * - Basic exam information
 * - Question details
 * - MCQ options or direct answers
 * - Points and time limits
 * 
 * @returns {Object} Structured exam data
 */
function collectExamData() {
    const examData = {
        title: document.getElementById('examTitle').value,
        description: document.getElementById('examDescription').value,
        targetYear: document.getElementById('targetYear').value,
        targetSemester: document.getElementById('targetSemester').value,
        targetGroup: document.getElementById('targetGroup').value,
        questions: []
    };

    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
        const question = {
            text: card.querySelector('.question-text').value,
            type: card.querySelector('.mcq-options') ? 'mcq' : 'direct',
            points: parseInt(card.querySelector('.points').value),
            timeLimit: parseInt(card.querySelector('.time-limit').value)
        };

        if (question.type === 'mcq') {
            question.options = [];
            card.querySelectorAll('.mcq-option').forEach(option => {
                question.options.push({
                    text: option.querySelector('.option-text').value,
                    isCorrect: option.querySelector('.option-correct').checked
                });
            });
        } else {
            question.correctAnswer = card.querySelector('.correct-answer').value;
            question.tolerance = parseFloat(card.querySelector('.tolerance').value);
        }

        examData.questions.push(question);
    });

    return examData;
}

// Form submission handler
document.getElementById('examForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const examData = collectExamData();
        
        if (!validateExamData(examData)) {
            return;
        }

        const response = await fetch('/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(examData)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Exam created successfully!');
            window.location.href = '/exams.html';
        } else {
            throw new Error(result.message || 'Failed to create exam');
        }

    } catch (error) {
        console.error('Error creating exam:', error);
        alert('Failed to create exam: ' + error.message);
    }
});

/**
 * Validates exam data before submission
 * 
 * Checks:
 * - Required fields are filled
 * - Questions have necessary content
 * - MCQ questions have sufficient options
 * - At least one correct answer for MCQs
 * - Direct questions have answers
 * 
 * @param {Object} examData - The exam data to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateExamData(examData) {
    if (!examData.title) {
        alert('Please enter an exam title');
        return false;
    }

    if (!examData.targetYear || !examData.targetSemester) {
        alert('Please select target year and semester');
        return false;
    }

    if (examData.questions.length === 0) {
        alert('Please add at least one question');
        return false;
    }

    for (let i = 0; i < examData.questions.length; i++) {
        const q = examData.questions[i];
        if (!q.text) {
            alert(`Question ${i + 1} is missing text`);
            return false;
        }

        if (q.type === 'mcq') {
            if (!q.options || q.options.length < 2) {
                alert(`Question ${i + 1} needs at least 2 options`);
                return false;
            }
            if (!q.options.some(opt => opt.isCorrect)) {
                alert(`Question ${i + 1} needs at least one correct answer`);
                return false;
            }
        } else {
            if (!q.correctAnswer) {
                alert(`Question ${i + 1} needs a correct answer`);
                return false;
            }
        }
    }

    return true;
} 