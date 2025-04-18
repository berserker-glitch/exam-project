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
const questionEditModal = document.getElementById('questionEditModal');
const questionEditForm = document.getElementById('questionEditForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Event listeners
examForm.addEventListener('submit', handleExamSubmit);
addQuestionBtn.addEventListener('click', openQuestionTypeModal);
closeModalBtn.addEventListener('click', closeQuestionTypeModal);
questionTypeModal.addEventListener('click', selectQuestionType);
cancelQuestionBtn.addEventListener('click', closeQuestionCreationModal);
questionForm.addEventListener('submit', handleQuestionSubmit);
questionEditForm.addEventListener('submit', handleQuestionEdit);
cancelEditBtn.addEventListener('click', closeQuestionEditModal);

// Global variables
let examData = {
    name: '',
    field: '',
    semester: '',
    group: '',
    questions: []
};

// Handle exam form submission
async function handleExamSubmit(event) {
    event.preventDefault();

    const examName = document.getElementById('examName').value.trim();
    const targetField = document.getElementById('targetField').value;
    const targetSemester = document.getElementById('targetSemester').value;
    const targetGroup = document.getElementById('targetGroup').value.trim();

    if (!validateExamDetails(examName, targetField, targetSemester)) {
        return;
    }

    examData.name = examName;
    examData.field = targetField;
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
function validateExamDetails(examName, targetField, targetSemester) {
    if (examName === '') {
        showErrorMessage('Please enter an exam name.');
        return false;
    }

    if (targetField === '' || targetField === null) {
        showErrorMessage('Please select a target field.');
        return false;
    }

    if (targetSemester === '' || targetSemester === null) {
        showErrorMessage('Please select a target semester.');
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

// Open question edit modal
function openQuestionEditModal(questionIndex) {
    const question = examData.questions[questionIndex];
    if (!question) return;

    questionEditModal.style.display = 'block';
    
    // Set form fields
    document.getElementById('editQuestionIndex').value = questionIndex;
    document.getElementById('editQuestionText').value = question.text;
    document.getElementById('editCorrectAnswer').value = question.correctAnswer;
    document.getElementById('editPoints').value = question.points;

    const editOptionsContainer = document.getElementById('editOptionsContainer');
    editOptionsContainer.innerHTML = '';

    if (question.type === 'mcq' && question.options) {
        const optionsLabel = document.createElement('label');
        optionsLabel.textContent = 'Options';
        editOptionsContainer.appendChild(optionsLabel);

        const mcqOptionsDiv = document.createElement('div');
        mcqOptionsDiv.id = 'editMcqOptions';
        editOptionsContainer.appendChild(mcqOptionsDiv);

        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'mcq-option';
            optionDiv.innerHTML = `
                <input type="text" name="editOption${index + 1}" value="${option}" placeholder="Option ${index + 1}" required>
                <button type="button" class="btn remove-option-btn">
                    <i class="fas fa-times"></i>
                </button>
            `;
            mcqOptionsDiv.appendChild(optionDiv);
        });

        const addOptionBtn = document.createElement('button');
        addOptionBtn.type = 'button';
        addOptionBtn.className = 'btn add-option-btn';
        addOptionBtn.id = 'addEditOptionBtn';
        addOptionBtn.innerHTML = '<i class="fas fa-plus"></i> Add Option';
        editOptionsContainer.appendChild(addOptionBtn);

        document.getElementById('addEditOptionBtn').addEventListener('click', addEditMCQOption);
        
        const removeOptionBtns = editOptionsContainer.querySelectorAll('.remove-option-btn');
        removeOptionBtns.forEach(btn => {
            btn.addEventListener('click', removeEditMCQOption);
        });
    }
}

// Close question edit modal
function closeQuestionEditModal() {
    questionEditModal.style.display = 'none';
    questionEditForm.reset();
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
        id: generateUUID(),
        type: questionType,
        text: questionText,
        correctAnswer: correctAnswer,
        points: points
    };

    if (questionType === 'mcq') {
        const options = [];
        const optionInputs = document.querySelectorAll('#mcqOptions input[type="text"]');
        optionInputs.forEach(input => {
            options.push(input.value.trim());
        });
        question.options = options;
    }

    examData.questions.push(question);
    displayQuestion(question, examData.questions.length - 1);
    closeQuestionCreationModal();
}

// Handle question edit form submission
async function handleQuestionEdit(event) {
    event.preventDefault();

    const questionIndex = parseInt(document.getElementById('editQuestionIndex').value);
    const questionText = document.getElementById('editQuestionText').value.trim();
    const correctAnswer = document.getElementById('editCorrectAnswer').value.trim();
    const points = parseInt(document.getElementById('editPoints').value);

    if (!validateQuestionDetails(questionText, correctAnswer, points)) {
        return;
    }

    const question = examData.questions[questionIndex];
    if (!question) return;

    question.text = questionText;
    question.correctAnswer = correctAnswer;
    question.points = points;

    if (question.type === 'mcq') {
        const options = [];
        const optionInputs = document.querySelectorAll('#editMcqOptions input[type="text"]');
        optionInputs.forEach(input => {
            options.push(input.value.trim());
        });
        question.options = options;
    }

    // Update the question display
    updateQuestionDisplay(question, questionIndex);
    closeQuestionEditModal();
}

// Update question display after edit
function updateQuestionDisplay(question, index) {
    const questionElement = document.getElementById(`question-${index}`);
    if (!questionElement) return;

    const questionHeader = questionElement.querySelector('.question-header h3');
    if (questionHeader) {
        questionHeader.textContent = `Question ${index + 1}`;
    }

    const questionText = questionElement.querySelector('.question-text');
    if (questionText) {
        questionText.textContent = question.text;
    }

    // Update points display
    const pointsDisplay = questionElement.querySelector('.question-points');
    if (pointsDisplay) {
        pointsDisplay.textContent = `${question.points} points`;
    }

    // Update options for MCQ questions
    if (question.type === 'mcq' && question.options) {
        const optionsList = questionElement.querySelector('.question-options');
        if (optionsList) {
            optionsList.innerHTML = '';
            question.options.forEach(option => {
                const optionItem = document.createElement('li');
                optionItem.textContent = option;
                optionsList.appendChild(optionItem);
            });
        }
    }
}

// Validate question details
function validateQuestionDetails(questionText, correctAnswer, points) {
    if (questionText === '') {
        showErrorMessage('Please enter question text.');
        return false;
    }

    if (correctAnswer === '') {
        showErrorMessage('Please enter the correct answer.');
        return false;
    }

    if (isNaN(points) || points < 0) {
        showErrorMessage('Please enter a valid number of points.');
        return false;
    }

    return true;
}

// Display question in the UI
function displayQuestion(question, index) {
    const questionElement = document.createElement('div');
    questionElement.id = `question-${index}`;
    questionElement.className = 'question-card';
    
    // Define question type label
    const typeLabel = question.type === 'mcq' ? 
                     'Multiple Choice' : 'Direct Answer';
    
    // Create question HTML with edit and delete buttons
    questionElement.innerHTML = `
        <div class="question-header">
            <h3>Question ${index + 1}</h3>
            <div class="question-actions">
                <button type="button" class="btn edit-question-btn" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn delete-question-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="question-meta">
            <span class="question-type">${typeLabel}</span>
            <span class="question-points">${question.points} points</span>
        </div>
        <p class="question-text">${question.text}</p>
    `;
    
    // Add options for multiple choice questions
    if (question.type === 'mcq' && question.options) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'question-options-container';
        optionsContainer.innerHTML = '<p>Options:</p><ul class="question-options"></ul>';
        
        const optionsList = optionsContainer.querySelector('.question-options');
        question.options.forEach(option => {
            const optionItem = document.createElement('li');
            optionItem.textContent = option;
            optionsList.appendChild(optionItem);
        });
        
        questionElement.appendChild(optionsContainer);
    }
    
    // Add correct answer for direct answer questions
    if (question.type === 'direct') {
        const answerContainer = document.createElement('div');
        answerContainer.className = 'question-answer-container';
        answerContainer.innerHTML = `<p>Correct Answer: <span class="correct-answer">${question.correctAnswer}</span></p>`;
        questionElement.appendChild(answerContainer);
    }
    
    questionContainer.appendChild(questionElement);
    
    // Add event listeners to the edit and delete buttons
    const editBtn = questionElement.querySelector('.edit-question-btn');
    const deleteBtn = questionElement.querySelector('.delete-question-btn');
    
    editBtn.addEventListener('click', () => {
        openQuestionEditModal(index);
    });
    
    deleteBtn.addEventListener('click', () => {
        deleteQuestion(index);
    });
}

// Delete a question
function deleteQuestion(index) {
    if (confirm('Are you sure you want to delete this question?')) {
        examData.questions.splice(index, 1);
        refreshQuestionDisplay();
    }
}

// Refresh question display after deletion
function refreshQuestionDisplay() {
    questionContainer.innerHTML = '';
    examData.questions.forEach((question, index) => {
        displayQuestion(question, index);
    });
}

// Add MCQ option in question creation
function addMCQOption() {
    const mcqOptions = document.getElementById('mcqOptions');
    const optionCount = mcqOptions.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'mcq-option';
    optionDiv.innerHTML = `
        <input type="text" name="option${optionCount}" placeholder="Option ${optionCount}" required>
        <button type="button" class="btn remove-option-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    mcqOptions.appendChild(optionDiv);
    
    // Add event listener to the new remove button
    const removeBtn = optionDiv.querySelector('.remove-option-btn');
    removeBtn.addEventListener('click', removeMCQOption);
}

// Add MCQ option in question edit modal
function addEditMCQOption() {
    const mcqOptions = document.getElementById('editMcqOptions');
    const optionCount = mcqOptions.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'mcq-option';
    optionDiv.innerHTML = `
        <input type="text" name="editOption${optionCount}" placeholder="Option ${optionCount}" required>
        <button type="button" class="btn remove-option-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    mcqOptions.appendChild(optionDiv);

    // Add event listener to the new remove button
    const removeBtn = optionDiv.querySelector('.remove-option-btn');
    removeBtn.addEventListener('click', removeEditMCQOption);
}

// Remove MCQ option in question creation
function removeMCQOption(event) {
    const mcqOptions = document.getElementById('mcqOptions');
    if (mcqOptions.children.length <= 2) {
        showErrorMessage('Multiple choice questions must have at least 2 options.');
        return;
    }
    
    const optionDiv = event.target.closest('.mcq-option');
    mcqOptions.removeChild(optionDiv);
    
    // Reindex the remaining options
    const optionInputs = mcqOptions.querySelectorAll('input[type="text"]');
    optionInputs.forEach((input, index) => {
        input.name = `option${index + 1}`;
        input.placeholder = `Option ${index + 1}`;
    });
}

// Remove MCQ option in question edit modal
function removeEditMCQOption(event) {
    const mcqOptions = document.getElementById('editMcqOptions');
    if (mcqOptions.children.length <= 2) {
        showErrorMessage('Multiple choice questions must have at least 2 options.');
        return;
    }
    
    const optionDiv = event.target.closest('.mcq-option');
    mcqOptions.removeChild(optionDiv);
    
    // Reindex the remaining options
    const optionInputs = mcqOptions.querySelectorAll('input[type="text"]');
    optionInputs.forEach((input, index) => {
        input.name = `editOption${index + 1}`;
        input.placeholder = `Option ${index + 1}`;
    });
}

// Display success message
function showSuccessMessage(message) {
    // Check if there's an existing message
    let messageContainer = document.querySelector('.message-container');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        document.querySelector('.create-exam-container').prepend(messageContainer);
    }
    
    messageContainer.innerHTML = `<div class="message success">${message}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

// Display error message
function showErrorMessage(message) {
    // Check if there's an existing message
    let messageContainer = document.querySelector('.message-container');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        document.querySelector('.create-exam-container').prepend(messageContainer);
    }
    
    messageContainer.innerHTML = `<div class="message error">${message}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

// Reset form
function resetForm() {
    examForm.reset();
    questionContainer.innerHTML = '';
    examData = {
        name: '',
        field: '',
        semester: '',
        group: '',
        questions: []
    };
}

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Display exam link after successful creation
function displayExamLink(examId) {
    // Check if there's an existing link display
    let linkContainer = document.querySelector('.exam-link-container');
    
    if (linkContainer) {
        linkContainer.parentNode.removeChild(linkContainer);
    }
    
    linkContainer = document.createElement('div');
    linkContainer.className = 'exam-link-container';
    
    const examLink = `${window.location.origin}/views/take_exam.html?exam=${examId}`;
    
    linkContainer.innerHTML = `
        <div class="link-header">
            <h3>Exam Created Successfully!</h3>
            <p>Share this link with your students:</p>
        </div>
        <div class="link-content">
            <input type="text" id="examLinkInput" value="${examLink}" readonly>
            <button type="button" class="btn copy-link-btn" id="copyLinkBtn">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
        <div class="link-actions">
            <a href="dashboard.html" class="btn btn-primary">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
            <button type="button" class="btn btn-secondary" id="createNewExamBtn">
                <i class="fas fa-plus"></i> Create Another Exam
            </button>
        </div>
    `;
    
    document.querySelector('.create-exam-container').appendChild(linkContainer);
    
    // Add event listeners
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const linkInput = document.getElementById('examLinkInput');
        linkInput.select();
        document.execCommand('copy');
        showSuccessMessage('Exam link copied to clipboard!');
    });
    
    document.getElementById('createNewExamBtn').addEventListener('click', () => {
        linkContainer.parentNode.removeChild(linkContainer);
        resetForm();
    });
}

// Redirect to dashboard
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for smaller add question button
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .add-question-btn {
            padding: 6px 12px;
            font-size: 14px;
            border-radius: 4px;
        }
        .question-actions {
            display: flex;
            gap: 8px;
        }
        .edit-question-btn, .delete-question-btn {
            padding: 4px 8px;
            font-size: 12px;
        }
    `;
    document.head.appendChild(styleElement);
}); 