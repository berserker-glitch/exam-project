/**
 * Geolocation.js
 * 
 * This file handles geolocation functionality for the exam platform.
 * It ensures users enable location services before they can take an exam,
 * providing an additional layer of verification.
 */

// State variable to track if geolocation has been approved
let geolocationApproved = false;

/**
 * Initialize geolocation component and attach event listeners
 */
function initGeolocation() {
    console.log("Initializing geolocation module...");
    
    // Get the geolocation activation button
    const activateGeolocationBtn = document.getElementById('activateGeolocation');
    
    // Add event listener to the activation button
    if (activateGeolocationBtn) {
        activateGeolocationBtn.addEventListener('click', requestGeolocation);
        console.log("Geolocation button event listener attached");
    } else {
        console.error("Geolocation activation button not found in DOM");
    }
}

/**
 * Request user's geolocation when they want to start an exam
 */
function requestGeolocation() {
    console.log("Requesting geolocation permission...");
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                console.log(`Geolocation approved! Lat: ${latitude}, Long: ${longitude}`);
                
                // Mark geolocation as approved
                geolocationApproved = true;
                
                // Hide geolocation section and proceed with exam
                document.getElementById('geolocationActivation').style.display = 'none';
                
                // Show exam questions section
                document.getElementById('examQuestions').style.display = 'block';
                
                // Log for monitoring
                console.log("User granted geolocation access - proceeding with exam");
                
                // Dispatch custom event that exam can start
                const geolocationEvent = new CustomEvent('geolocationApproved', {
                    detail: {
                        latitude,
                        longitude,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(geolocationEvent);
            },
            // Error callback
            function(error) {
                console.error("Geolocation error:", error);
                console.log("Error code:", error.code);
                console.log("Error message:", error.message);
                console.log("Browser:", navigator.userAgent);
                console.log("Secure context:", window.isSecureContext);
                
                let errorMessage = "";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "L'accès à la géolocalisation a été refusé. Veuillez l'activer pour continuer l'examen.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Les informations de localisation ne sont pas disponibles. Vérifiez que la localisation est activée sur votre appareil.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "La demande de géolocalisation a expiré.";
                        break;
                    case error.UNKNOWN_ERROR:
                    default:
                        errorMessage = "Une erreur inconnue s'est produite.";
                }
                
                // Show error message to user
                alert(errorMessage);
                console.log("Geolocation error:", errorMessage);
                
                // Provide additional help in console
                console.log("Tips to fix geolocation issues:");
                console.log("1. Enable location services in your device settings");
                console.log("2. Make sure you're on a secure (HTTPS) connection");
                console.log("3. Try another browser");
                console.log("4. If on mobile, try moving to an area with better GPS signal");
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser");
        alert("La géolocalisation n'est pas prise en charge par votre navigateur. Veuillez utiliser un navigateur moderne pour passer l'examen.");
    }
}

/**
 * Check if geolocation is approved before starting an exam
 * @returns {boolean} - Whether geolocation is approved
 */
function isGeolocationApproved() {
    return geolocationApproved;
}

/**
 * Function to be called from take_exam.js when the exam is about to start
 * Shows the geolocation activation panel and prevents exam from starting until approved
 */
function requireGeolocation() {
    console.log("Requiring geolocation before exam can start...");
    
    // Reset the approval state
    geolocationApproved = false;
    
    // Hide other sections
    document.getElementById('examLinkSection').style.display = 'none';
    
    // Show geolocation activation section
    document.getElementById('geolocationActivation').style.display = 'block';
    
    // Return a promise that resolves when geolocation is approved
    return new Promise((resolve) => {
        document.addEventListener('geolocationApproved', (event) => {
            console.log("Geolocation approved event received", event.detail);
            resolve(event.detail);
        }, { once: true });
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGeolocation);

// Export functions to global scope for use in other scripts
window.requireGeolocation = requireGeolocation;
window.isGeolocationApproved = isGeolocationApproved; 