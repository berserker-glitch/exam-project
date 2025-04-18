// DOM elements
const userAuthSection = document.getElementById('userAuth');
const registrationForm = document.getElementById('registrationForm');
const loginForm = document.getElementById('loginForm');
const geolocationActivationSection = document.getElementById('geolocationActivation');
const activateGeolocationButton = document.getElementById('activateGeolocation');
const examQuestionsSection = document.getElementById('examQuestions');
const questionContainer = document.getElementById('questionContainer');
const prevQuestionButton = document.getElementById('prevQuestion');
const nextQuestionButton = document.getElementById('nextQuestion');
const submitExamButton = document.getElementById('submitExam');
const examResultSection = document.getElementById('examResult');
const examScoreElement = document.getElementById('examScore');
const examLinkSection = document.getElementById('examLinkSection');
const examLinkForm = document.getElementById('examLinkForm');

// Global variables
let currentQuestionIndex = 0;
let examQuestions = [];
let userAnswers = [];
let examDuration = 0;
let examTimer;
let currentUser = null;
let examId = null;
let examTitle = "Exam"; // Default title
let timeSpent = 0; // Track time spent on the exam

// Event listeners
registrationForm.addEventListener('submit', registerUser);
loginForm.addEventListener('submit', loginUser);
// Geolocation has been disabled, but keeping the event listener for UI continuity
activateGeolocationButton.addEventListener('click', skipGeolocation);
prevQuestionButton.addEventListener('click', showPreviousQuestion);
nextQuestionButton.addEventListener('click', showNextQuestion);
submitExamButton.addEventListener('click', submitExam);
if (examLinkForm) {
  examLinkForm.addEventListener('submit', handleExamLinkSubmit);
}

// Check if we need to initialize based on URL params
document.addEventListener('DOMContentLoaded', function() {
  // Add keyboard navigation
  document.addEventListener('keydown', handleKeyboardNavigation);

  // Check if there's an exam ID in the URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('exam')) {
    examId = urlParams.get('exam');
    initializeExam();
  }
  
  // Add event listeners to question answers
  document.addEventListener('change', function(event) {
    if (event.target.classList.contains('question-answer-input') || 
        event.target.classList.contains('mcq-option-input')) {
      saveAnswer();
    }
  });
});

// Handle keyboard navigation for accessibility
function handleKeyboardNavigation(e) {
  // Only work when in exam question mode
  if (examQuestionsSection.style.display !== 'block') return;
  
  if (e.key === 'ArrowLeft' && !prevQuestionButton.disabled) {
    showPreviousQuestion();
  } else if (e.key === 'ArrowRight' && nextQuestionButton.style.display !== 'none') {
    showNextQuestion();
  } else if (e.key === 'Enter' && submitExamButton.style.display !== 'none' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
    submitExam();
  } else if (e.key >= '1' && e.key <= '9') {
    const numericKey = parseInt(e.key);
    if (numericKey <= examQuestions.length) {
      saveAnswer();
      showQuestion(numericKey - 1); 
    }
  }
}

// Functions
async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (response.ok) {
      showSuccessMessage('Registration successful! Please login.');
      loginForm.reset();
      showLoginForm();
    } else {
      const error = await response.json();
      showErrorMessage(`Registration failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error during registration:', error);
    showErrorMessage('An error occurred during registration. Please try again.');
  }
}

async function loginUser(event, emailOverride, passwordOverride) {
  event.preventDefault();
  
  // Check if parameters were provided (verification mode)
  let email, password;
  
  if (emailOverride && passwordOverride) {
    // Verification mode - email and password were passed directly
    console.log('Using verification mode with provided credentials');
    email = emailOverride;
    password = passwordOverride;
  } else {
    // Regular login mode - read from form
    console.log('Using regular login mode with form data');
    // Check if we are in password-only mode (user is already logged in)
    const passwordOnly = currentUser !== null;
    
    if (passwordOnly) {
      // User is already logged in, just verify password
      email = currentUser.email;
      password = document.getElementById('verifyPassword').value;
    } else {
      // Full login required
      email = document.getElementById('loginEmail').value;
      password = document.getElementById('loginPassword').value;
    }
  }

  console.log(`Attempting login for ${email}`);

  // TEMPORARY FALLBACK: Simulate login with localStorage since backend API is not yet implemented
  // Remove this block once the backend API is ready
  try {
    // Just for demo, store user login
    currentUser = { 
      email: email, 
      name: 'User', 
      field: 'smi',
      semester: 2
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('token', 'demo-token');
    
    userAuthSection.style.display = 'none';
    
    // If we have an exam ID from URL or form, proceed to load the exam
    if (examId) {
      fetchExamQuestions(examId);
      examQuestionsSection.style.display = 'block';
      examLinkSection.style.display = 'none';
    } else {
      // Show the exam link input form
      examLinkSection.style.display = 'block';
    }
    
    return; // Skip the API call
  } catch (error) {
    console.error('Error during mock login:', error);
    showErrorMessage('An error occurred during login simulation. Please try again.');
    return;
  }

  // REAL API LOGIN - Uncomment when backend is ready
  /*
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      currentUser = { email: email, name: data.name };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      userAuthSection.style.display = 'none';
      
      // Skip the geolocation step and proceed directly
      skipGeolocation();
    } else {
      const error = await response.json();
      showErrorMessage(`Login failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error during login:', error);
    showErrorMessage('An error occurred during login. Please try again.');
  }
  */
}

// Function to skip geolocation and proceed to the next step
function skipGeolocation() {
  // Hide geolocation section
  geolocationActivationSection.style.display = 'none';
  
  // Check if we have an exam link in the URL
  const examLink = getExamLinkFromUrl();
  if (examLink) {
    // Direct exam access via URL - fetch questions directly
    fetchExamQuestions(examLink).then(() => {
      examQuestionsSection.style.display = 'block';
    }).catch(error => {
      console.error('Error fetching exam questions:', error);
      showErrorMessage('Failed to load exam questions. Please try again or contact support.');
    });
  } else {
    // No exam link, show the exam link input section
    examLinkSection.style.display = 'block';
  }
}

// Original geolocation function - now disabled and commented out for reference
/*
async function activateGeolocation() {
  if ('geolocation' in navigator) {
    try {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          await sendLocationToBackend(latitude, longitude);
          geolocationActivationSection.style.display = 'none';
          
          // Check if we have an exam link in the URL
          const examLink = getExamLinkFromUrl();
          if (examLink) {
            // Direct exam access via URL
            await fetchExamQuestions(examLink);
            examQuestionsSection.style.display = 'block';
          } else {
            // Show exam link input
            examLinkSection.style.display = 'block';
          }
        },
        error => {
          console.error('Error retrieving geolocation:', error);
          
          // Show appropriate error message based on error code
          let errorMessage = 'Failed to retrieve your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'You denied permission to access your location. Please enable location access in your browser settings and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable. Please check your device settings or try another device.';
              break;
            case error.TIMEOUT:
              errorMessage += 'The request to get your location timed out. Please try again.';
              break;
            default:
              errorMessage += 'Please allow location access or contact support.';
          }
          
          showGeolocationError(errorMessage);
        },
        // Additional geolocation options
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error in geolocation process:', error);
      showGeolocationError('An error occurred with geolocation. Please try again or contact support.');
    }
  } else {
    console.error('Geolocation is not supported by this browser.');
    showGeolocationError('Geolocation is not supported by your browser. Please use a different browser or contact support.');
  }
}
*/

// Dummy function for geolocation - we're not actually sending location data
async function sendLocationToBackend(latitude, longitude) {
  console.log('Geolocation bypassed. Location data would normally be sent to backend.');
  return true;
}

// Function to show geolocation error with retry button
function showGeolocationError(message) {
  // Create error container if it doesn't exist
  let errorContainer = document.getElementById('geolocationErrorContainer');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'geolocationErrorContainer';
    errorContainer.className = 'geolocation-error';
    geolocationActivationSection.appendChild(errorContainer);
  }
  
  errorContainer.innerHTML = `
    <p class="error-message">${message}</p>
    <button id="retryGeolocation" class="btn btn-primary">Try Again</button>
    <p class="geolocation-help">
      <strong>Need help?</strong> Make sure:
      <ul>
        <li>Location services are enabled on your device</li>
        <li>You've given permission to this site to use your location</li>
        <li>You're not using a VPN that might hide your location</li>
      </ul>
    </p>
  `;
  
  // Add event listener for retry button
  document.getElementById('retryGeolocation').addEventListener('click', skipGeolocation);
}

function showErrorMessage(message) {
  // Check if there's an existing message
  let messageContainer = document.querySelector('.message-container');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.querySelector('.exam-container').prepend(messageContainer);
  }
  
  messageContainer.innerHTML = `<div class="message error">
    <i class="fas fa-exclamation-circle"></i> ${message}
  </div>`;
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);
}

function showSuccessMessage(message) {
  // Check if there's an existing message
  let messageContainer = document.querySelector('.message-container');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.querySelector('.exam-container').prepend(messageContainer);
  }
  
  messageContainer.innerHTML = `<div class="message success">
    <i class="fas fa-check-circle"></i> ${message}
  </div>`;
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);
}

function getExamLinkFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('exam');
}

async function handleExamLinkSubmit(event) {
  event.preventDefault();
  const examLink = document.getElementById('examLink').value.trim();
  
  if (!examLink) {
    showErrorMessage('Please enter a valid exam link.');
    return;
  }
  
  try {
    await fetchExamQuestions(examLink);
    examLinkSection.style.display = 'none';
    examQuestionsSection.style.display = 'block';
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    showErrorMessage('Failed to load the exam. Please check the link and try again.');
  }
}

async function fetchExamQuestions(examLink) {
  // Extract exam ID from link if it's a full URL
  let examId = examLink;
  if (examLink.includes('?exam=')) {
    examId = examLink.split('?exam=')[1];
  }
  
  // TEMPORARY FALLBACK: Fetch from localStorage since backend API is not yet implemented
  try {
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const exam = exams.find(e => e.id === examId);
    
    if (!exam) {
      throw new Error('Exam not found');
    }
    
    console.log('Found exam:', exam);
    
    // Set up exam data
    examQuestions = exam.questions;
    examDuration = 60 * 60; // Default to 60 minutes if not specified
    examTitle = exam.name || "Exam";
    
    // Set the page title to include the exam name
    document.title = `Taking: ${examTitle} - Exam Platform`;
    
    // Initialize user answers array
    userAnswers = new Array(examQuestions.length).fill(null);
    
    // Display the first question
    showQuestion(0);
    updateQuestionNavigation();
    updateNavigationButtons();
    
    // Start exam timer
    startExamTimer();
    
    return exam;
  } catch (error) {
    console.error('Error fetching exam from localStorage:', error);
    showErrorMessage('Exam not found. Please check the link and try again.');
    throw error;
  }
}

function startExamTimer() {
  let timeRemaining = examDuration;
  
  // Create timer display if it doesn't exist
  let timerDisplay = document.getElementById('examTimer');
  if (!timerDisplay) {
    timerDisplay = document.createElement('div');
    timerDisplay.id = 'examTimer';
    timerDisplay.className = 'exam-timer';
    examQuestionsSection.prepend(timerDisplay);
  }
  
  // Update timer display
  function updateTimer() {
    timeSpent = examDuration - timeRemaining; // Update time spent
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    timerDisplay.innerHTML = `
      <i class="fas fa-clock"></i> Time Remaining: 
      ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
    `;
    
    // Change colors based on time remaining
    if (timeRemaining <= 300) { // 5 minutes warning
      timerDisplay.classList.add('timer-warning');
      timerDisplay.querySelector('i').className = 'fas fa-exclamation-circle';
    } else if (timeRemaining <= 600) { // 10 minutes warning
      timerDisplay.style.color = 'var(--warning-color)';
    }
    
    if (timeRemaining <= 0) {
      clearInterval(examTimer);
      showErrorMessage('Time is up! Your exam is being submitted automatically.');
      submitExam();
    }
    
    timeRemaining--;
  }
  
  // Initial display
  updateTimer();
  
  // Start countdown
  examTimer = setInterval(updateTimer, 1000);
}

function showQuestion(index) {
  // Validate index
  if (index < 0 || index >= examQuestions.length) {
    return;
  }

  currentQuestionIndex = index;
  const question = examQuestions[index];
    
  // Clear previous question
  questionContainer.innerHTML = '';

  // Create question card
  const questionCard = document.createElement('div');
  questionCard.className = 'question-card';
  
  // Question header
  const questionHeader = document.createElement('div');
  questionHeader.className = 'question-header';
  questionHeader.innerHTML = `
    <h3>Question ${index + 1} of ${examQuestions.length}</h3>
    <span class="question-points">${question.points} points</span>
  `;
  questionCard.appendChild(questionHeader);
  
  // Question text
  const questionText = document.createElement('p');
  questionText.className = 'question-text';
  questionText.textContent = question.text;
  questionCard.appendChild(questionText);
  
  // Question answer area
  const answerArea = document.createElement('div');
  answerArea.className = 'question-answer-area';
  
  if (question.type === 'mcq' && question.options) {
    // Multiple choice question
    question.options.forEach((option, optIndex) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'mcq-option';
      
      const optionInput = document.createElement('input');
      optionInput.type = 'radio';
      optionInput.name = `question-${index}`;
      optionInput.id = `option-${index}-${optIndex}`;
      optionInput.value = option;
      optionInput.className = 'mcq-option-input';
      
      // Check if this option was previously selected
      if (userAnswers[index] === option) {
        optionInput.checked = true;
      }
      
      const optionLabel = document.createElement('label');
      optionLabel.htmlFor = `option-${index}-${optIndex}`;
      optionLabel.textContent = option;
      
      // Add keyboard shortcut
      const shortcutSpan = document.createElement('span');
      shortcutSpan.className = 'keyboard-shortcut';
      shortcutSpan.textContent = `Option ${optIndex + 1}`;
      optionLabel.appendChild(shortcutSpan);
      
      optionDiv.appendChild(optionInput);
      optionDiv.appendChild(optionLabel);
      answerArea.appendChild(optionDiv);
      
      // Add keyboard shortcut for options (1-9)
      optionInput.addEventListener('keydown', function(e) {
        const key = e.key;
        if (key >= '1' && key <= '9') {
          const keyIndex = parseInt(key) - 1;
          if (keyIndex < question.options.length) {
            const targetOption = document.getElementById(`option-${index}-${keyIndex}`);
            if (targetOption) {
              targetOption.checked = true;
              saveAnswer();
            }
          }
        }
      });
    });
  } else {
    // Direct answer question
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Your answer...';
    answerInput.className = 'question-answer-input';
    
    // Set the previous answer if available
    if (userAnswers[index]) {
      answerInput.value = userAnswers[index];
    }
    
    answerArea.appendChild(answerInput);
    
    // Auto-focus on the input
    setTimeout(() => answerInput.focus(), 100);
  }
  
  questionCard.appendChild(answerArea);
  
  // Add navigation hints
  const navigationHints = document.createElement('div');
  navigationHints.className = 'navigation-hints';
  navigationHints.innerHTML = `
    <div class="hint"><kbd>←</kbd> Previous</div>
    <div class="hint"><kbd>→</kbd> Next</div>
    <div class="hint"><kbd>Enter</kbd> Submit (when on last question)</div>
    <div class="hint"><kbd>1-9</kbd> Jump to question</div>
  `;
  questionCard.appendChild(navigationHints);
  
  questionContainer.appendChild(questionCard);
  
  // Update navigation buttons
  updateNavigationButtons();
  
  // Update the active dot in the navigation
  updateQuestionNavigation();
  
  // Update answered counter
  updateAnsweredCounter();
}

function updateNavigationButtons() {
  // Disable previous button on first question
  prevQuestionButton.disabled = currentQuestionIndex === 0;
  
  // Show/hide next and submit buttons
  if (currentQuestionIndex === examQuestions.length - 1) {
    nextQuestionButton.style.display = 'none';
    submitExamButton.style.display = 'inline-block';
  } else {
    nextQuestionButton.style.display = 'inline-block';
    submitExamButton.style.display = 'none';
  }
}

function updateQuestionNavigation() {
  const navigationDots = document.getElementById('questionNavigation');
  navigationDots.innerHTML = '';
    
  examQuestions.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    
    // Add number inside dot for better navigation
    dot.textContent = index + 1;
        
    // Add appropriate classes
    if (index === currentQuestionIndex) {
      dot.classList.add('active');
    }
        
    if (userAnswers[index] !== null) {
      dot.classList.add('answered');
    }
        
    // Add click event to navigate to the question
    dot.addEventListener('click', () => {
      saveAnswer(); // Save current answer before switching
      showQuestion(index);
    });
        
    navigationDots.appendChild(dot);
  });
}

function updateAnsweredCounter() {
  const answeredCount = userAnswers.filter(answer => answer !== null).length;
  const totalCount = examQuestions.length;
    
  const answeredCounter = document.getElementById('answeredCounter');
  answeredCounter.textContent = `${answeredCount}/${totalCount} questions answered`;
    
  // Add visual indicator if all questions are answered
  if (answeredCount === totalCount) {
    answeredCounter.classList.add('all-answered');
  } else {
    answeredCounter.classList.remove('all-answered');
  }
}

function showNextQuestion() {
  saveAnswer();
  if (currentQuestionIndex < examQuestions.length - 1) {
    showQuestion(currentQuestionIndex + 1);
  }
}

function showPreviousQuestion() {
  saveAnswer();
  if (currentQuestionIndex > 0) {
    showQuestion(currentQuestionIndex - 1);
  }
}

function saveAnswer() {
  const question = examQuestions[currentQuestionIndex];
  let answer = null;
  
  if (question.type === 'mcq') {
    // Get selected option for MCQ
    const selectedOption = document.querySelector(`input[name="question-${currentQuestionIndex}"]:checked`);
    if (selectedOption) {
      answer = selectedOption.value;
    }
  } else {
    // Get text input for direct questions
    const answerInput = document.querySelector('.question-answer-input');
    if (answerInput && answerInput.value.trim() !== '') {
      answer = answerInput.value.trim();
    }
  }
  
  userAnswers[currentQuestionIndex] = answer;
  
  // Update the navigation dots
  updateQuestionNavigation();
  
  // Update answered counter
  updateAnsweredCounter();
}

async function submitExam() {
  // Save the current answer
  saveAnswer();
  
  const unansweredCount = userAnswers.filter(answer => answer === null).length;
  let confirmMessage = 'Are you sure you want to submit your exam? You cannot change your answers after submission.';
  
  if (unansweredCount > 0) {
    confirmMessage = `Warning: You have ${unansweredCount} unanswered questions. Are you sure you want to submit your exam?`;
  }
  
  if (!confirm(confirmMessage)) {
    return;
  }
    
  // Stop the timer
  clearInterval(examTimer);

  // Calculate score
  let score = 0;
  let totalPoints = 0;
  let correctAnswers = 0;
    
  examQuestions.forEach((question, index) => {
    totalPoints += question.points;
    
    if (userAnswers[index] === null) {
      // Unanswered question, no points
      return;
    }
    
    if (question.type === 'mcq') {
      // For MCQ, the answer must match exactly
      if (userAnswers[index] === question.correctAnswer) {
        score += question.points;
        correctAnswers++;
      }
    } else {
      // For direct answers, comparison should be case-insensitive
      if (userAnswers[index].toLowerCase() === question.correctAnswer.toLowerCase()) {
        score += question.points;
        correctAnswers++;
      }
    }
  });

  // Calculate percentage score
  const percentageScore = Math.round((score / totalPoints) * 100);
  
  // Display result
  examQuestionsSection.style.display = 'none';
  examResultSection.style.display = 'block';
  
  examScoreElement.textContent = percentageScore;
  document.getElementById('correctAnswers').textContent = correctAnswers;
  document.getElementById('totalQuestions').textContent = examQuestions.length;
  
  // Calculate time taken (in minutes)
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  document.getElementById('timeTaken').textContent = `${minutes} min ${seconds} sec`;
  
  // Update page title
  document.title = `Result: ${percentageScore}% - ${examTitle}`;
  
  // Display appropriate message based on score
  let resultMessage = '';
  if (percentageScore >= 90) {
    resultMessage = 'Excellent job! Outstanding performance!';
  } else if (percentageScore >= 80) {
    resultMessage = 'Great work! You did very well!';
  } else if (percentageScore >= 70) {
    resultMessage = 'Good job! You passed with a solid score.';
  } else if (percentageScore >= 60) {
    resultMessage = 'Not bad! You passed the exam.';
  } else if (percentageScore >= 50) {
    resultMessage = 'You passed, but there\'s room for improvement.';
  } else {
    resultMessage = 'You didn\'t pass this time. Keep studying and try again!';
  }
  
  // Add result message to the DOM
  const resultMessageElement = document.createElement('p');
  resultMessageElement.className = 'result-message';
  resultMessageElement.textContent = resultMessage;
  document.querySelector('.result-card').insertBefore(resultMessageElement, document.querySelector('.result-details'));
  
  // Save score to localStorage
  saveExamScore(percentageScore);
  
  // Show success message
  showSuccessMessage(`Exam submitted successfully! Your score: ${percentageScore}%`);
}

function saveExamScore(score) {
  if (!currentUser || !currentUser.email) {
    console.error('No user logged in, cannot save score');
    return;
  }
  
  const userId = currentUser.email;
  
  const scoreData = {
    examId: examId,
    examTitle: examTitle,
    score: score,
    dateTaken: new Date().toISOString(),
    status: score >= 50 ? 'Passed' : 'Failed',
    timeTaken: timeSpent  // Save time taken in seconds
  };
  
  // Get all user scores from localStorage
  const allUserScores = JSON.parse(localStorage.getItem('allUserScores') || '{}');
  
  // Add or create user scores array
  if (!allUserScores[userId]) {
    allUserScores[userId] = [];
  }
  
  // Add new score
  allUserScores[userId].push(scoreData);
  
  // Save back to localStorage
  localStorage.setItem('allUserScores', JSON.stringify(allUserScores));
  console.log(`Score saved for user ${userId}: ${score}%`);
}

function showLoginForm() {
  registrationForm.style.display = 'none';
  loginForm.style.display = 'block';
}

async function initializeExam() {
  // Check if user is logged in
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
      
    // Show verify section with email prefilled
    userAuthSection.style.display = 'block';
    document.getElementById('loginRegisterSection').style.display = 'none';
    document.getElementById('verifySection').style.display = 'block';
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
  } else {
    // User not logged in, show login/register options
    userAuthSection.style.display = 'block';
    document.getElementById('loginRegisterSection').style.display = 'block';
    document.getElementById('verifySection').style.display = 'none';
  }
}