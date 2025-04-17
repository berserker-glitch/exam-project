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
      password = document.getElementById('loginPassword').value;
    } else {
      // Full login required
      email = document.getElementById('loginEmail').value;
      password = document.getElementById('loginPassword').value;
    }
  }

  console.log(`Attempting login for ${email}`);

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
  const errorMessage = document.createElement('div');
  errorMessage.classList.add('error-message');
  errorMessage.textContent = message;
  document.body.appendChild(errorMessage);

  setTimeout(() => {
    errorMessage.remove();
  }, 5000);
}

function showSuccessMessage(message) {
  const successMessage = document.createElement('div');
  successMessage.classList.add('success-message');
  successMessage.textContent = message;
  document.body.appendChild(successMessage);

  setTimeout(() => {
    successMessage.remove();
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
  
  examLinkSection.style.display = 'none';
  await fetchExamQuestions(examLink);
  examQuestionsSection.style.display = 'block';
}

async function fetchExamQuestions(examLink) {
  try {
    // TEMPORARY FALLBACK: Fetch from localStorage since backend API is not yet implemented
    // Remove this block once the backend API is ready
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const exam = exams.find(exam => exam.id === examLink);
    
    if (exam) {
      console.log('Exam loaded from localStorage:', exam);
      examQuestions = exam.questions || [];
      examDuration = exam.duration || 60; // Default 60 minutes if not specified
      
      if (examQuestions.length === 0) {
        showErrorMessage('This exam does not have any questions. Please contact your instructor.');
        return;
      }
      
      startExamTimer();
      showQuestion(currentQuestionIndex);
    } else {
      showErrorMessage('Exam not found. Please check the exam link and try again.');
    }
    return; // Skip the API call for now
    
    // Uncomment this block once the backend API is ready
    /*
    const response = await fetch(`/api/exams/${examLink}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const exam = await response.json();
      examQuestions = exam.questions;
      examDuration = exam.duration || 60; // Default 60 minutes if not specified
      startExamTimer();
      showQuestion(currentQuestionIndex);
    } else {
      const error = await response.json();
      showErrorMessage(`Failed to fetch exam questions: ${error.message}`);
    }
    */
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    showErrorMessage('An error occurred while fetching exam questions. Please try again.');
  }
}

function startExamTimer() {
  const endTime = Date.now() + examDuration * 60000;
  
  // Create timer display if it doesn't exist
  if (!document.getElementById('examTimer')) {
    const timerElement = document.createElement('div');
    timerElement.id = 'examTimer';
    timerElement.classList.add('exam-timer');
    examQuestionsSection.insertBefore(timerElement, questionContainer);
  }
  
  examTimer = setInterval(() => {
    const remainingTime = endTime - Date.now();
    
    if (remainingTime <= 0) {
      clearInterval(examTimer);
      showErrorMessage('Exam time is up! Submitting answers...');
      submitExam();
    } else {
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      document.getElementById('examTimer').textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// Function to show a specific question
function showQuestion(index) {
    if (index < 0 || index >= examQuestions.length) {
        console.error('Invalid question index:', index);
        return;
    }

    // Save current answer before switching questions
    saveAnswer();

    // Update current question index
    currentQuestionIndex = index;
    
    const question = examQuestions[index];
    const questionContainer = document.getElementById('questionContainer');
    questionContainer.innerHTML = '';

    // Create question title
    const titleElement = document.createElement('h3');
    titleElement.className = 'question-title';
    titleElement.textContent = `Question ${index + 1}: ${question.title || 'Untitled Question'}`;
    questionContainer.appendChild(titleElement);

    // Create question text
    const textElement = document.createElement('p');
    textElement.className = 'question-text';
    textElement.textContent = question.text;
    questionContainer.appendChild(textElement);

    // Create answer input based on question type
    if (question.type === 'multiple_choice') {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        question.options.forEach((option, optionIndex) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'option-wrapper';
            
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.id = `option_${optionIndex}`;
            radioInput.name = `question_${index}`;
            radioInput.value = option;
            
            // Check if user has previously selected this option
            if (userAnswers[index] === option) {
                radioInput.checked = true;
            }
            
            // Add event listener to save answer on change
            radioInput.addEventListener('change', () => {
                if (radioInput.checked) {
                    userAnswers[index] = option;
                    updateQuestionNavigation();
                    updateAnsweredCounter();
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = `option_${optionIndex}`;
            label.textContent = option;
            
            optionWrapper.appendChild(radioInput);
            optionWrapper.appendChild(label);
            optionsContainer.appendChild(optionWrapper);
        });
        
        questionContainer.appendChild(optionsContainer);
    } else if (question.type === 'direct_answer') {
        const answerTextarea = document.createElement('textarea');
        answerTextarea.id = 'answerInput';
        answerTextarea.className = 'answer-input';
        answerTextarea.placeholder = 'Type your answer here...';
        
        // Set previously saved answer if exists
        if (userAnswers[index]) {
            answerTextarea.value = userAnswers[index];
        }
        
        // Add input event to auto-save answer as user types
        answerTextarea.addEventListener('input', () => {
            userAnswers[index] = answerTextarea.value.trim();
            updateQuestionNavigation();
            updateAnsweredCounter();
        });
        
        questionContainer.appendChild(answerTextarea);
    }

    // Update navigation UI
    updateNavigationButtons();
    updateQuestionNavigation();
    updateAnsweredCounter();
}

// Update the navigation buttons based on current question index
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevQuestion');
    const nextButton = document.getElementById('nextQuestion');
    
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === examQuestions.length - 1;
}

// Update question navigation dots
function updateQuestionNavigation() {
    const navigationContainer = document.getElementById('questionNavigation');
    navigationContainer.innerHTML = '';
    
    examQuestions.forEach((_, index) => {
        const navDot = document.createElement('span');
        navDot.className = 'nav-dot';
        
        // Add classes based on current state
        if (index === currentQuestionIndex) {
            navDot.classList.add('current');
        }
        
        if (userAnswers[index] !== undefined && userAnswers[index] !== '') {
            navDot.classList.add('answered');
        }
        
        // Add click event to navigate to this question
        navDot.addEventListener('click', () => {
            showQuestion(index);
        });
        
        navigationContainer.appendChild(navDot);
    });
}

// Update the answered questions counter
function updateAnsweredCounter() {
    const answeredCounter = document.getElementById('answeredCounter');
    if (!answeredCounter) return;
    
    const answeredCount = Object.values(userAnswers).filter(answer => answer !== undefined && answer !== '').length;
    const totalCount = examQuestions.length;
    
    answeredCounter.textContent = `${answeredCount}/${totalCount} questions answered`;
    
    // Change color based on completion
    if (answeredCount === totalCount) {
        answeredCounter.classList.add('complete');
        answeredCounter.classList.remove('incomplete');
    } else {
        answeredCounter.classList.add('incomplete');
        answeredCounter.classList.remove('complete');
    }
}

// Show next question
function showNextQuestion() {
    if (currentQuestionIndex < examQuestions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

// Show previous question
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

function saveAnswer() {
    if (currentQuestionIndex === -1 || !examQuestions.length) return;
    
    const question = examQuestions[currentQuestionIndex];
    
    if (question.type === 'direct_answer') {
        const answerInput = document.getElementById('answerInput');
        if (answerInput && answerInput.value.trim()) {
            userAnswers[currentQuestionIndex] = answerInput.value.trim();
        }
    } else if (question.type === 'multiple_choice') {
        const selectedOption = document.querySelector(`input[name="question_${currentQuestionIndex}"]:checked`);
        if (selectedOption) {
            userAnswers[currentQuestionIndex] = selectedOption.value;
        }
    }
    
    // Mark question as answered if it has a valid answer
    if (userAnswers[currentQuestionIndex]) {
        updateQuestionNavigation();
        updateAnsweredCounter();
    }
}

async function submitExam() {
  try {
    // Save the current answer before submitting
    saveAnswer();
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      showErrorMessage('You must be logged in to submit an exam');
      return;
    }
    
    console.log('Submitting exam with answers:', userAnswers);
    console.log('Exam questions:', examQuestions);

    // Calculate score
    let score = 0;
    let totalQuestions = examQuestions.length;
    
    console.log('Calculating score. Total questions:', totalQuestions);
    
    examQuestions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      console.log(`Question ${index + 1}:`, question);
      console.log(`User answer:`, userAnswer);
      
      if (question.type === 'direct') {
        // For direct questions, normalize both answers for comparison
        const normalizedCorrectAnswer = String(question.correctAnswer || '').trim().toLowerCase();
        const normalizedUserAnswer = userAnswer ? String(userAnswer).trim().toLowerCase() : '';
        
        console.log(`Direct question comparison - Correct: "${normalizedCorrectAnswer}", User: "${normalizedUserAnswer}"`);
        
        if (normalizedUserAnswer === normalizedCorrectAnswer) {
          score++;
          console.log(`Question ${index + 1}: Correct! +1 point`);
        } else {
          console.log(`Question ${index + 1}: Incorrect. Correct answer was: ${question.correctAnswer}`);
        }
      } else if (question.type === 'mcq') {
        // For MCQs, handle different formats for correctAnswer
        let correctOption;
        
        if (Array.isArray(question.correctAnswer)) {
          // If correctAnswer is an array, use the first element
          correctOption = question.correctAnswer[0];
        } else if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
          // If correctAnswer is an object (like {id: 0, text: "answer"}), use the id
          correctOption = question.correctAnswer.id !== undefined ? question.correctAnswer.id : question.correctAnswer.text;
        } else {
          // Otherwise use the value directly
          correctOption = question.correctAnswer;
        }
        
        console.log(`MCQ comparison - Correct: "${correctOption}", User: "${userAnswer}"`);
        
        // Compare as strings to handle potential type mismatches
        if (String(userAnswer) === String(correctOption)) {
          score++;
          console.log(`Question ${index + 1}: Correct! +1 point`);
        } else {
          console.log(`Question ${index + 1}: Incorrect. Correct option was: ${correctOption}`);
        }
      }
    });

    // Calculate percentage score
    const percentageScore = Math.round((score / totalQuestions) * 100);
    console.log(`Final score: ${score}/${totalQuestions} = ${percentageScore}%`);

    // Clear the exam timer
    if (examTimer) {
      clearInterval(examTimer);
    }

    // TEMPORARY: Store result in localStorage instead of sending to server
    // Remove this block when backend API is ready
    const examId = getExamLinkFromUrl();
    const examHistory = JSON.parse(localStorage.getItem('examHistory') || '[]');
    const exam = JSON.parse(localStorage.getItem('exams') || '[]').find(e => e.id === examId);
    
    examHistory.push({
      examId: examId,
      examName: exam ? exam.title : 'Unknown Exam',
      score: percentageScore,
      totalQuestions: totalQuestions,
      correctAnswers: score,
      dateTaken: new Date().toISOString()
    });
    localStorage.setItem('examHistory', JSON.stringify(examHistory));
    
    // Hide the exam section
    examQuestionsSection.style.display = 'none';
    
    // Show the result section
    examResultSection.style.display = 'block';
    examScoreElement.textContent = `${percentageScore}% (${score} out of ${totalQuestions} correct)`;
    
    // Uncomment this block when backend API is ready
    /*
    // Send results to server
    const response = await fetch('/api/exams/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        examId: getExamLinkFromUrl(),
        answers: userAnswers,
        score: percentageScore
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      // Hide the exam section
      examQuestionsSection.style.display = 'none';
      
      // Show the result section
      examResultSection.style.display = 'block';
      examScoreElement.textContent = `${percentageScore}% (${score} out of ${totalQuestions} correct)`;
    } else {
      const error = await response.json();
      showErrorMessage(`Failed to submit exam: ${error.message}`);
    }
    */
  } catch (error) {
    console.error('Error submitting exam:', error);
    showErrorMessage('An error occurred while submitting your exam. Please try again.');
  }
}

function showLoginForm() {
  document.getElementById('registrationForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  
  // If user is already logged in, show only password field
  if (currentUser) {
    document.getElementById('loginEmail').parentElement.style.display = 'none';
    document.querySelector('#loginForm h3').textContent = 'Verify Your Identity';
    document.querySelector('#loginForm button').textContent = 'Verify';
  }
}

async function initializeExam() {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    
    if (token && storedUser) {
      // User is logged in
      currentUser = JSON.parse(storedUser);
      
      // Verify token is still valid
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Token is valid, check if we have an exam link in the URL
        const examLink = getExamLinkFromUrl();
        
        if (examLink) {
          // Show password verification
          showLoginForm();
          userAuthSection.style.display = 'block';
        } else {
          // No exam link, show login form
          showLoginForm();
          userAuthSection.style.display = 'block';
        }
      } else {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        currentUser = null;
        userAuthSection.style.display = 'block';
      }
    } else {
      // User is not logged in
      userAuthSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Error initializing exam:', error);
    userAuthSection.style.display = 'block';
  }
}

initializeExam();