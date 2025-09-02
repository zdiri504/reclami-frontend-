// =====================
// Tracking System
// =====================

document.addEventListener("DOMContentLoaded", function() {
    console.log("Module de suivi initialisé");
    setupTrackingForm();
});

function setupTrackingForm() {
    const trackingForm = document.getElementById('tracking-form');
    if (trackingForm) {
        trackingForm.addEventListener('submit', handleTrackingSubmit);
    }
}

async function handleTrackingSubmit(e) {
    e.preventDefault();
    
    const trackingNumber = document.getElementById('tracking-number').value.trim();
    if (!trackingNumber) {
        showError('Veuillez entrer un numéro de référence');
        return;
    }
    
    // Afficher le chargement
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recherche...';
    submitBtn.disabled = true;
    
    try {
        // Appel à l'API de suivi
        const response = await fetch(`${API_BASE_URL}/complaints/track/${trackingNumber}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayTrackingResult(data.complaint);
        } else {
            showTrackingError(data.message || 'Réclamation non trouvée');
        }
    } catch (error) {
        console.error('Erreur lors du suivi:', error);
        showTrackingError('Erreur de connexion. Veuillez réessayer.');
    } finally {
        // Réinitialiser le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function displayTrackingResult(complaint) {
    // Masquer les messages d'erreur
    document.getElementById('tracking-error').style.display = 'none';
    
    // Afficher le résultat
    const resultContainer = document.getElementById('tracking-result');
    resultContainer.style.display = 'block';
    
    // Mettre à jour la référence
    document.getElementById('result-reference').textContent = complaint.reference_id;
    
    // Générer la timeline de statut
    generateStatusTimeline(complaint);
    
    // Générer les détails de la réclamation
    generateComplaintDetails(complaint);
    
    // Générer l'historique
    generateStatusHistory(complaint);
    
    // Afficher l'historique
    document.getElementById('history-section').style.display = 'block';
    
    // Scroller vers les résultats
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function generateStatusTimeline(complaint) {
    const timeline = document.getElementById('status-timeline');
    timeline.innerHTML = '';
    
    const statuses = ['Nouveau', 'En cours', 'Résolu', 'Fermé'];
    const currentStatus = complaint.status;
    
    statuses.forEach((status, index) => {
        const step = document.createElement('div');
        step.className = 'status-step';
        
        let icon, statusText;
        switch (status) {
            case 'Nouveau':
                icon = 'fas fa-file-alt';
                statusText = 'Soumis';
                break;
            case 'En cours':
                icon = 'fas fa-cog';
                statusText = 'En traitement';
                break;
            case 'Résolu':
                icon = 'fas fa-check-circle';
                statusText = 'Résolu';
                break;
            case 'Fermé':
                icon = 'fas fa-times-circle';
                statusText = 'Fermé';
                break;
        }
        
        // Déterminer l'état de l'étape
        if (status === currentStatus) {
            step.classList.add('active');
        } else if (statuses.indexOf(status) < statuses.indexOf(currentStatus)) {
            step.classList.add('completed');
        }
        
        step.innerHTML = `
            <div class="status-icon">
                <i class="${icon}"></i>
            </div>
            <h4>${statusText}</h4>
            <span>${getStatusDate(complaint, status)}</span>
        `;
        
        timeline.appendChild(step);
    });
}

function generateComplaintDetails(complaint) {
    const detailsContainer = document.getElementById('complaint-details');
    detailsContainer.innerHTML = '';
    
    const details = [
        { label: 'Référence', value: complaint.reference_id },
        { label: 'Date de soumission', value: formatDate(complaint.created_at) },
        { label: 'Type de réclamation', value: complaint.type },
        { label: 'Sujet', value: complaint.subject },
        { label: 'Priorité', value: complaint.priority || 'Normale' },
        { label: 'Statut actuel', value: complaint.status }
    ];
    
    details.forEach(detail => {
        const detailCard = document.createElement('div');
        detailCard.className = 'detail-card';
        detailCard.innerHTML = `
            <h4>${detail.label}</h4>
            <p class="value">${detail.value}</p>
        `;
        detailsContainer.appendChild(detailCard);
    });
}

function generateStatusHistory(complaint) {
    const historyContainer = document.getElementById('history-items');
    historyContainer.innerHTML = '';
    
    if (complaint.status_history && complaint.status_history.length > 0) {
        complaint.status_history.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = formatDate(history.created_at);
            const changedBy = history.changed_by ? history.changed_by.name : 'Système';
            
            historyItem.innerHTML = `
                <div class="history-date">${date}</div>
                <div class="history-content">
                    <h4>Changement de statut: ${history.old_status || 'Création'} → ${history.new_status}</h4>
                    <p>${history.notes || 'Changement effectué par ' + changedBy}</p>
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    } else {
        // Historique par défaut si aucun historique n'est disponible
        const defaultHistory = document.createElement('div');
        defaultHistory.className = 'history-item';
        defaultHistory.innerHTML = `
            <div class="history-date">${formatDate(complaint.created_at)}</div>
            <div class="history-content">
                <h4>Soumission initiale</h4>
                <p>Votre réclamation a été soumise et est en cours d'examen par notre équipe.</p>
            </div>
        `;
        historyContainer.appendChild(defaultHistory);
    }
    
    // Ajouter les réponses si disponibles
    if (complaint.responses && complaint.responses.length > 0) {
        complaint.responses.forEach(response => {
            const responseItem = document.createElement('div');
            responseItem.className = 'history-item';
            
            const date = formatDate(response.created_at);
            const adminName = response.admin ? response.admin.name : 'Administrateur';
            
            responseItem.innerHTML = `
                <div class="history-date">${date}</div>
                <div class="history-content">
                    <h4>Réponse de l'équipe</h4>
                    <p><strong>${adminName}:</strong> ${response.response}</p>
                </div>
            `;
            
            historyContainer.appendChild(responseItem);
        });
    }
}

function getStatusDate(complaint, status) {
    if (status === 'Nouveau') {
        return formatDate(complaint.created_at);
    }
    
    if (complaint.status_history) {
        const historyItem = complaint.status_history.find(h => h.new_status === status);
        if (historyItem) {
            return formatDate(historyItem.created_at);
        }
    }
    
    return '-';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options);
}

function showTrackingError(message) {
    const errorContainer = document.getElementById('tracking-error');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorContainer.style.display = 'block';
    
    // Masquer les autres sections
    document.getElementById('tracking-result').style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    
    // Scroller vers l'erreur
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    // Créer une alerte temporaire
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="alert-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Insérer au début du formulaire
    const form = document.getElementById('tracking-form');
    form.insertBefore(alert, form.firstChild);
    
    // Auto-supprimer après 5 secondes
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}
