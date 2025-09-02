// =====================
// Reset Password Management
// =====================

document.addEventListener("DOMContentLoaded", function() {
    console.log("Module de réinitialisation du mot de passe initialisé");
    setupResetPasswordForms();
});

// Configuration des formulaires de réinitialisation
function setupResetPasswordForms() {
    // Formulaire de demande de réinitialisation
    const resetRequestForm = document.getElementById('reset-request-form');
    if (resetRequestForm) {
        resetRequestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleResetRequest();
        });
    }

    // Formulaire de réinitialisation du mot de passe
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePasswordReset();
        });
    }

    // Vérifier si on a un token dans l'URL (pour la réinitialisation)
    checkForResetToken();
}

// Gérer la demande de réinitialisation
async function handleResetRequest() {
    const email = document.getElementById('reset-email').value.trim();
    
    // Validation
    if (!email) {
        showError("Veuillez saisir votre adresse e-mail");
        return;
    }
    
    if (!isValidEmail(email)) {
        showError("Format d'e-mail invalide");
        return;
    }

    // Afficher l'indicateur de chargement
    const submitBtn = document.querySelector('#reset-request-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;

    try {
        // Appel API pour envoyer l'e-mail de réinitialisation
        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            // Succès - afficher le message de confirmation
            showSuccess();
        } else {
            // Erreur de l'API
            const errorMessage = data.message || data.error || "Une erreur s'est produite lors de l'envoi de l'e-mail";
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation:', error);
        showError("Erreur de connexion. Veuillez réessayer.");
    } finally {
        // Restaurer le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Gérer la réinitialisation du mot de passe
async function handlePasswordReset() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    // Validation
    if (!newPassword || !confirmPassword) {
        showError("Tous les champs sont obligatoires");
        return;
    }
    
    if (newPassword.length < 8) {
        showError("Le mot de passe doit contenir au moins 8 caractères");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError("Les mots de passe ne correspondent pas");
        return;
    }

    // Récupérer le token depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError("Token de réinitialisation manquant");
        return;
    }

    // Afficher l'indicateur de chargement
    const submitBtn = document.querySelector('#reset-password-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Réinitialisation...';
    submitBtn.disabled = true;

    try {
        // Appel API pour réinitialiser le mot de passe
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                email: getEmailFromToken(), // Récupérer l'email depuis le token ou l'URL
                password: newPassword,
                password_confirmation: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Succès - rediriger vers la page de connexion
            showSuccess("Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Erreur de l'API
            const errorMessage = data.message || data.error || "Une erreur s'est produite lors de la réinitialisation";
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        showError("Erreur de connexion. Veuillez réessayer.");
    } finally {
        // Restaurer le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Vérifier s'il y a un token de réinitialisation dans l'URL
function checkForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Afficher le formulaire de réinitialisation
        document.getElementById('reset-request-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'block';
        document.querySelector('h2').textContent = 'Définir un nouveau mot de passe';
        document.querySelector('.form-description').textContent = 'Entrez votre nouveau mot de passe';
    }
}

// Récupérer l'email depuis l'URL ou le token
function getEmailFromToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email') || '';
}

// Afficher le message de succès
function showSuccess(message = null) {
    const successMessage = document.getElementById('success-message');
    const resetRequestForm = document.getElementById('reset-request-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    
    if (message) {
        document.querySelector('#success-message h3').textContent = 'Succès !';
        document.querySelector('#success-message p').textContent = message;
    }
    
    successMessage.style.display = 'block';
    resetRequestForm.style.display = 'none';
    resetPasswordForm.style.display = 'none';
}

// Afficher le message d'erreur
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Masquer le message d'erreur
function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

// Validation d'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Gestion des erreurs réseau
window.addEventListener('offline', function() {
    showError("Vous êtes hors ligne. Veuillez vérifier votre connexion internet.");
});

// Gestion des erreurs de l'API
function handleApiError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError("Erreur de connexion au serveur. Veuillez réessayer.");
    } else {
        showError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    }
}
