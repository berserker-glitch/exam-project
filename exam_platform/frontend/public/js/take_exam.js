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
let examTitle = "Examen"; // Default title
let timeSpent = 0; // Track time spent on the exam
let examSubmitted = false;

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
      showSuccessMessage('Inscription réussie ! Veuillez vous connecter.');
      loginForm.reset();
      showLoginForm();
    } else {
      const error = await response.json();
      showErrorMessage(`Échec de l'inscription : ${error.message}`);
    }
  } catch (error) {
    console.error('Error during registration:', error);
    showErrorMessage('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
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
    showErrorMessage('Une erreur est survenue lors de la simulation de connexion. Veuillez réessayer.');
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
      showErrorMessage(`Échec de connexion : ${error.message}`);
    }
  } catch (error) {
    console.error('Error during login:', error);
    showErrorMessage('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
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
      showErrorMessage('Échec du chargement des questions d\'examen. Veuillez réessayer ou contacter le support.');
    });
  } else {
    // No exam link, show the exam link input section
    examLinkSection.style.display = 'block';
  }
}

// Geolocation can be re-enabled if needed
function getGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log(`User location: ${latitude}, ${longitude}`);
        sendLocationToBackend(latitude, longitude);
        skipGeolocation();
      },
      error => {
        console.error('Error retrieving geolocation:', error);
        
        // Show appropriate error message based on error code
        let errorMessage = 'Impossible de récupérer votre position. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Vous avez refusé l\'accès à votre position. Veuillez activer l\'accès à la localisation dans les paramètres de votre navigateur et réessayer.';
            break;
            
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Les informations de localisation ne sont pas disponibles. Veuillez vérifier les paramètres de votre appareil ou essayer un autre appareil.';
            break;
            
          case error.TIMEOUT:
            errorMessage += 'La demande de géolocalisation a expiré. Veuillez réessayer.';
            break;
            
          default:
            errorMessage += 'Veuillez autoriser l\'accès à la localisation ou contacter le support.';
        }
        
        showGeolocationError(errorMessage);
      },
      { timeout: 10000 }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
    showGeolocationError('La géolocalisation n\'est pas prise en charge par votre navigateur. Veuillez utiliser un autre navigateur ou contacter le support.');
  }
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
    <button type="button" class="btn btn-primary" id="retryGeolocation">
      <i class="fas fa-redo"></i> Réessayer
    </button>
    <button type="button" class="btn btn-secondary" id="skipGeolocation">
      <i class="fas fa-forward"></i> Passer
    </button>
    <div class="geolocation-help">
      <p>Si vous continuez à avoir des problèmes :</p>
      <ul>
        <li>Vérifiez que la localisation est activée sur votre appareil</li>
        <li>Vérifiez les paramètres de permission de votre navigateur</li>
        <li>Essayez d'utiliser un autre navigateur</li>
        <li>Contactez le support technique</li>
      </ul>
    </div>
  `;
  
  // Add event listeners to buttons
  document.getElementById('retryGeolocation').addEventListener('click', getGeolocation);
  document.getElementById('skipGeolocation').addEventListener('click', skipGeolocation);
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
    showErrorMessage('Veuillez saisir un lien d\'examen valide.');
    return;
  }
  
  try {
  await fetchExamQuestions(examLink);
  examLinkSection.style.display = 'none';
  examQuestionsSection.style.display = 'block';
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    showErrorMessage('Échec du chargement de l\'examen. Veuillez vérifier le lien et réessayer.');
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
    
    // Set exam duration from exam timer (in minutes) or default to 60 minutes
    if (exam.timer && !isNaN(exam.timer)) {
      examDuration = exam.timer * 60; // Convert minutes to seconds
    } else {
      examDuration = 60 * 60; // Default to 60 minutes if not specified
      console.warn('No timer found for exam, defaulting to 60 minutes');
    }
    
    examTitle = exam.name || "Examen";
    
    // Set the page title to include the exam name
    document.title = `En cours : ${examTitle} - Plateforme d'Examen`;
    
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
    showErrorMessage('Examen introuvable. Veuillez vérifier le lien et réessayer.');
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
    
    // Add timer info showing total duration
    const totalMinutes = Math.floor(examDuration / 60);
    const timerInfo = document.createElement('div');
    timerInfo.className = 'timer-info';
    timerInfo.innerHTML = `<i class="fas fa-info-circle"></i> Cet examen a une limite de temps de ${totalMinutes} minutes`;
    
    // Add both elements to the exam section
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';
    timerContainer.appendChild(timerDisplay);
    timerContainer.appendChild(timerInfo);
    
    examQuestionsSection.prepend(timerContainer);
  }
  
  // Update timer display
  function updateTimer() {
    timeSpent = examDuration - timeRemaining; // Update time spent
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    timerDisplay.innerHTML = `
      <i class="fas fa-clock"></i> Temps Restant: 
      ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
    `;
    
    // Change colors based on time remaining
    if (timeRemaining <= 300) { // 5 minutes warning
      timerDisplay.classList.add('timer-warning');
      timerDisplay.querySelector('i').className = 'fas fa-exclamation-circle';
      
      // Also update the timer container for more emphasis
      const timerContainer = timerDisplay.closest('.timer-container');
      if (timerContainer) {
        timerContainer.style.borderColor = 'var(--error-color)';
        timerContainer.style.borderWidth = '2px';
        timerContainer.style.borderStyle = 'solid';
      }
    } else if (timeRemaining <= 600) { // 10 minutes warning
      timerDisplay.style.color = 'var(--warning-color)';
    }
    
    if (timeRemaining <= 0) {
      clearInterval(examTimer);
      showErrorMessage('Temps écoulé ! Votre examen est soumis automatiquement.');
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
    <h3>Question ${index + 1} sur ${examQuestions.length}</h3>
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
    answerInput.placeholder = 'Votre réponse...';
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
    <div class="hint"><kbd>←</kbd> Précédent</div>
    <div class="hint"><kbd>→</kbd> Suivant</div>
    <div class="hint"><kbd>Enter</kbd> Soumettre (sur la dernière question)</div>
    <div class="hint"><kbd>1-9</kbd> Aller à la question</div>
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
  const totalQuestions = examQuestions.length;
  
  const answeredCounter = document.getElementById('answeredCounter');
  if (answeredCounter) {
    answeredCounter.textContent = `${answeredCount}/${totalQuestions} questions répondues`;
  }
  
  // Show submit button when all questions answered
  if (answeredCount === totalQuestions) {
    submitExamButton.style.display = 'block';
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
  // Prevent double submission
  if (examSubmitted) {
    return;
  }
  
  // Save the current answer
    saveAnswer();
    
  const unansweredCount = userAnswers.filter(answer => answer === null).length;
  let confirmMessage = 'Êtes-vous sûr de vouloir soumettre votre examen ? Vous ne pourrez pas modifier vos réponses après la soumission.';
  let warningText = '';
  
  if (unansweredCount > 0) {
    confirmMessage = 'Êtes-vous sûr de vouloir soumettre votre examen ?';
    warningText = `Attention : Vous avez ${unansweredCount} question${unansweredCount === 1 ? '' : 's'} sans réponse.`;
  }
  
  // Create custom confirmation modal
  showConfirmationModal(confirmMessage, warningText, () => {
    // This runs when user confirms submission
    finalizeExamSubmission();
  });
}

// Custom confirmation modal for exam submission
function showConfirmationModal(message, warningText, onConfirm) {
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'confirmSubmissionModal';
  
  const iconClass = warningText ? 'fa-exclamation-triangle' : 'fa-question-circle';
  const iconColor = warningText ? 'var(--warning-color)' : 'var(--primary-color)';
  
  modal.innerHTML = `
    <div class="modal-content confirmation-modal">
      <div class="confirmation-icon">
        <i class="fas ${iconClass}" style="color: ${iconColor}"></i>
      </div>
      <h3>Soumettre l'Examen</h3>
      <p>${message}</p>
      ${warningText ? `<p class="warning-text">${warningText}</p>` : ''}
      <p class="note-text">Vous ne pourrez pas modifier vos réponses après la soumission.</p>
      <div class="confirmation-buttons">
        <button id="cancelSubmission" class="btn btn-secondary">
          <i class="fas fa-times"></i> Annuler
        </button>
        <button id="confirmSubmission" class="btn btn-primary">
          <i class="fas fa-check"></i> Soumettre l'Examen
        </button>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.appendChild(modal);
  
  // Add custom CSS for the confirmation modal
  const modalStyle = document.createElement('style');
  modalStyle.textContent = `
    #confirmSubmissionModal {
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      backdrop-filter: blur(3px);
    }
    
    .confirmation-modal {
      max-width: 500px;
      text-align: center;
      padding: 2rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      background-color: white;
      border-radius: 8px;
      position: relative;
      animation: modalZoomIn 0.3s ease-out;
    }
    
    @keyframes modalZoomIn {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .confirmation-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: pulse 1s infinite alternate;
    }
    
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.05); }
    }
    
    .confirmation-modal h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }
    
    .confirmation-modal p {
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    
    .confirmation-modal .warning-text {
      color: var(--warning-color);
      font-weight: bold;
      background-color: rgba(255, 193, 7, 0.1);
      padding: 0.75rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    
    .confirmation-modal .note-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: 1.5rem;
    }
    
    .confirmation-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    .confirmation-buttons button {
      min-width: 120px;
      padding: 0.75rem 1.25rem;
    }
    
    #confirmSubmission {
      background-color: var(--primary-color);
    }
    
    #confirmSubmission:hover {
      background-color: var(--primary-dark);
    }
    
    @media (max-width: 576px) {
      .confirmation-buttons {
        flex-direction: column;
      }
      
      .confirmation-buttons button {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(modalStyle);
  
  // Add event listeners
  document.getElementById('cancelSubmission').addEventListener('click', () => {
    // Close the modal
    document.body.removeChild(modal);
    document.head.removeChild(modalStyle);
    examSubmitted = false; // Allow re-submission
  });
  
  document.getElementById('confirmSubmission').addEventListener('click', () => {
    // Close the modal
    document.body.removeChild(modal);
    document.head.removeChild(modalStyle);
    
    // Call the confirm callback
    onConfirm();
  });
}

// Finalize exam submission after confirmation
function finalizeExamSubmission() {
  examSubmitted = true;
  
  // Stop the timer
      clearInterval(examTimer);
  
  // Remove the timer display
  const timerContainer = document.querySelector('.timer-container');
  if (timerContainer) {
    timerContainer.remove();
  }

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
  document.title = `Résultat: ${percentageScore}% - ${examTitle}`;
  
  // Display appropriate message based on score
  let resultMessage = '';
  if (percentageScore >= 90) {
    resultMessage = 'Excellent travail ! Performance exceptionnelle !';
  } else if (percentageScore >= 80) {
    resultMessage = 'Très bien ! Vous avez très bien réussi !';
  } else if (percentageScore >= 70) {
    resultMessage = 'Bon travail ! Vous avez obtenu un score solide.';
  } else if (percentageScore >= 60) {
    resultMessage = 'Pas mal ! Vous avez réussi l\'examen.';
  } else if (percentageScore >= 50) {
    resultMessage = 'Vous avez réussi, mais il y a place à l\'amélioration.';
    } else {
    resultMessage = 'Vous n\'avez pas réussi cette fois-ci. Continuez à étudier et réessayez !';
  }
  
  // Add result message to the DOM
  const resultMessageElement = document.createElement('p');
  resultMessageElement.className = 'result-message';
  resultMessageElement.textContent = resultMessage;
  document.querySelector('.result-card').insertBefore(resultMessageElement, document.querySelector('.result-details'));
  
  // Save score to localStorage
  saveExamScore(percentageScore);
  
  // Show success message
  showSuccessMessage(`Examen soumis avec succès ! Votre score : ${percentageScore}%`);
}

function saveExamScore(score) {
  if (!currentUser || !currentUser.email) {
    console.error('No user logged in, cannot save score');
    return;
  }
  
  const userId = currentUser.email;
  
  const scoreData = {
    userId: userId, // Explicitly adding userId to score object for better tracking
      examId: examId,
    examTitle: examTitle,
    score: score,
    dateTaken: new Date().toISOString(),
    status: score >= 50 ? 'Réussi' : 'Échoué',
    timeTaken: timeSpent  // Save time taken in seconds
  };
  
  // Get all user scores from localStorage using the new structure
  const allUserScores = JSON.parse(localStorage.getItem('allUserScores') || '{}');
  
  // Add or create user scores array
  if (!allUserScores[userId]) {
    allUserScores[userId] = [];
  }
  
  // Add new score to localStorage
  allUserScores[userId].push(scoreData);
  localStorage.setItem('allUserScores', JSON.stringify(allUserScores));
  
  // Also maintain backward compatibility with the old format
  let userScores = JSON.parse(localStorage.getItem('userScores') || '[]');
  userScores.push(scoreData);
  localStorage.setItem('userScores', JSON.stringify(userScores));
  
  // Get token for authentication
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found, score saved only locally');
    return;
  }
  
  // Send score to the server
  fetch('/api/exams/scores', {
      method: 'POST',
        headers: {
        'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
      userId: userId,
      examId: scoreData.examId,
      examTitle: scoreData.examTitle,
      score: scoreData.score,
      timeTaken: scoreData.timeTaken,
      dateTaken: scoreData.dateTaken,
      status: scoreData.status
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to save score to server');
    }
    return response.json();
  })
  .then(data => {
    console.log('Score saved to server:', data);
  })
  .catch(error => {
    console.error('Error saving score to server:', error);
    // Score is still saved in localStorage as a fallback
  });
  
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