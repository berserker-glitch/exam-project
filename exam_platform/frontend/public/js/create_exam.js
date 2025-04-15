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

let questionCounter = 0;

/**
 * Displays the question type selection modal
 * Allows users to choose between MCQ and direct questions
 */
function showQuestionTypeModal() {
    document.getElementById('questionTypeModal').style.display = 'block';
}

/**
 * Hides the question type selection modal
 */
function closeQuestionTypeModal() {
    document.getElementById('questionTypeModal').style.display = 'none';
}

/**
 * Adds a new question to the exam
 * 
 * Creates either an MCQ or direct question based on type:
 * - Clones appropriate template
 * - Sets unique question ID
 * - Updates question numbering
 * - Adds to question list
 * 
 * @param {string} type - Question type ('mcq' or 'direct')
 */
function addQuestion(type) {
    questionCounter++;
    const template = document.getElementById(type === 'direct' ? 'directQuestionTemplate' : 'mcqQuestionTemplate');
    const questionsList = document.getElementById('questionsList');
    
    // Clone the template
    const questionNode = template.content.cloneNode(true);
    
    // Replace placeholders
    const questionHtml = questionNode.firstElementChild;
    questionHtml.dataset.questionId = questionCounter;
    questionHtml.innerHTML = questionHtml.innerHTML
        .replace(/QUESTION_ID/g, questionCounter)
        .replace(/QUESTION_NUMBER/g, questionCounter);
    
    // Add to questions list
    questionsList.appendChild(questionHtml);
    closeQuestionTypeModal();
}

/**
 * Adds a new option to an MCQ question
 * 
 * Creates an option with:
 * - Checkbox for correct answer
 * - Text input for option content
 * - Remove button
 * 
 * @param {number} questionId - ID of the MCQ question
 */
function addMCQOption(questionId) {
    const questionCard = document.querySelector(`[data-question-id="${questionId}"]`);
    const optionsContainer = questionCard.querySelector('.mcq-options');
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'mcq-option';
    optionDiv.innerHTML = `
        <input type="checkbox" class="option-correct">
        <input type="text" class="option-text" placeholder="Enter option">
        <button type="button" class="btn remove-option-btn" onclick="removeOption(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    optionsContainer.appendChild(optionDiv);
}

/**
 * Removes an MCQ option
 * @param {HTMLElement} button - Remove button element
 */
function removeOption(button) {
    button.closest('.mcq-option').remove();
}

/**
 * Deletes a question from the exam
 * Updates question numbering after deletion
 * 
 * @param {number} questionId - ID of the question to delete
 */
function deleteQuestion(questionId) {
    const question = document.querySelector(`[data-question-id="${questionId}"]`);
    question.remove();
    updateQuestionNumbers();
}

/**
 * Updates question numbers after deletion
 * Ensures sequential numbering of questions
 */
function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-card');
    questions.forEach((question, index) => {
        const number = index + 1;
        question.querySelector('h3').textContent = `Question ${number}`;
    });
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