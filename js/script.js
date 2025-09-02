// =====================
// App configuration
// =====================
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Keep /api for Laravel routes

// Authentication state
let currentUser = null;

// Initialize application
document.addEventListener("DOMContentLoaded", function() {
  console.log("Application de gestion de réclamations initialisée");
  
  // Load user from session
  loadUserSession();
  
  // Setup navigation
  setupNavigation();
  updateNavVisibility();
  enforceAccessControl();
  
  // Setup authentication forms
  setupAuthForms();
  
  // Setup reclamation forms
  setupReclamationForms();
});

// Load user from session storage
function loadUserSession() {
  const userData = sessionStorage.getItem('currentUser');
  if (userData) {
    currentUser = JSON.parse(userData);
    updateAuthUI();
  }
}

// Save user to session storage
function saveUserSession(user) {
  currentUser = user;
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  updateAuthUI();
  updateNavVisibility();
}

// Clear user session
function clearUserSession() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  updateAuthUI();
  updateNavVisibility();
}

// Update UI based on auth state
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userNav = document.getElementById('user-nav');
  
  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userNav) {
      userNav.style.display = 'flex';
      document.getElementById('user-name').textContent = currentUser.name;
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userNav) userNav.style.display = 'none';
  }
}

// Role-based nav visibility
function updateNavVisibility() {
  const hideForAdmin = ['correction.html', 'suivi.html'];
  const hideForClient = ['admin.html'];
  const navLinks = document.querySelectorAll('nav a');
  if (!navLinks.length) return;
  // Reset visibility
  navLinks.forEach(a => { a.parentElement.style.display = ''; });

  // If session user is not present, try to build minimal user from localStorage
  if (!currentUser) {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    const name = localStorage.getItem('user_name');
    if (token) {
      currentUser = { name: name || 'Utilisateur', role: role || 'client', token };
    }
  }

  // Prefer centralized navigation control if available
  if (typeof window.updateNavigationVisibility === 'function') {
    try { window.updateNavigationVisibility(); } catch (e) { /* ignore */ }
    return;
  }

  if (!currentUser) return; // still guest

  if (currentUser.role === 'admin') {
    navLinks.forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (hideForAdmin.some(x => href.endsWith(x))) a.parentElement.style.display = 'none';
    });
  } else {
    navLinks.forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (hideForClient.some(x => href.endsWith(x))) a.parentElement.style.display = 'none';
    });
  }
}

// Page access control (redirect if wrong role)
function enforceAccessControl() {
  const page = getCurrentPage();
  if (!currentUser) return; // No enforcement for guests for now

  if (page === 'admin.html' && currentUser.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  if ((page === 'correction.html' || page === 'suivi.html') && currentUser.role === 'admin') {
    window.location.href = 'admin.html';
  }
}

function getCurrentPage() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/') + 1).toLowerCase() || 'index.html';
}

// Setup navigation
function setupNavigation() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: requireAuthHeaders()
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          clearUserSession();
          // Also clear localStorage for the new navigation system
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_name');
          localStorage.removeItem('user_role');
          // Immediately update navigation visibility in this tab
          if (typeof window.updateNavigationVisibility === 'function') updateNavigationVisibility();
          try { updateNavVisibility(); } catch(e) {}
          // Redirect to login page so only the login screen is shown
          window.location.href = 'login.html';
        } else {
          alert("Erreur lors de la déconnexion");
        }
      })
      .catch(error => {
        console.error('Error:', error);
        clearUserSession();
        // Also clear localStorage for the new navigation system
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        if (typeof window.updateNavigationVisibility === 'function') updateNavigationVisibility();
        try { updateNavVisibility(); } catch(e) {}
        window.location.href = 'login.html';
      });
    });
  }
}

// Setup authentication forms
function setupAuthForms() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      // Validation côté client
      if (!email || !password) {
        alert("Tous les champs sont obligatoires");
        return;
      }
      
      if (!isValidEmail(email)) {
        alert("Format d'email invalide");
        return;
      }
      
      // API call to Laravel backend
      authenticateUser(email, password);
    });
  }
  
  // Registration form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Registration fields
      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('register-email')?.value.trim();
      const password = document.getElementById('register-password')?.value;
      const confirmPassword = document.getElementById('confirm-password')?.value;
      
      // Validation côté client selon AuthController
      if (!name || !email || !password || !confirmPassword) {
        alert("Tous les champs sont obligatoires");
        return;
      }
      
      if (name.length > 255) {
        alert("Le nom ne peut pas dépasser 255 caractères");
        return;
      }
      
      if (!isValidEmail(email)) {
        alert("Format d'email invalide");
        return;
      }
      
      if (password.length < 8) {
        alert("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }
      
      if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas !");
        return;
      }
      
      console.log("Register payload: ", {name, email, password, password_confirmation: confirmPassword});
      
      // API call to Laravel backend
      registerUser({ name, email, password, password_confirmation: confirmPassword });
    });
  }
}

// Setup reclamation forms
function setupReclamationForms() {
  const complaintForm = document.getElementById('complaint-form');
  if (complaintForm) {
    complaintForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!currentUser) {
        alert("Veuillez vous connecter pour soumettre une réclamation");
        window.location.href = 'login.html';
        return;
      }
      
      const complaintData = {
        type: document.getElementById('complaint-type').value,
        subject: document.getElementById('subject').value.trim(),
        description: document.getElementById('description').value.trim(),
        contact_info: document.getElementById('contact-info').value.trim()
      };
      
      // Validation côté client selon ComplaintController
      if (!complaintData.type || !complaintData.subject || !complaintData.description || !complaintData.contact_info) {
        alert("Tous les champs sont obligatoires");
        return;
      }
      
      const validTypes = ['Internet', 'Téléphonie', 'TV', 'Facturation', 'Autre'];
      if (!validTypes.includes(complaintData.type)) {
        alert("Type de réclamation invalide");
        return;
      }
      
      if (complaintData.subject.length > 255) {
        alert("Le sujet ne peut pas dépasser 255 caractères");
        return;
      }
      
      createComplaint(complaintData);
    });
  }
  
  // Tab functionality
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Authenticate user with Laravel backend
function authenticateUser(email, password) {
  fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Erreur de connexion');
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Store user data in localStorage for the new navigation system
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_role', data.user.role);
      
      // Also save to session for backward compatibility
      saveUserSession({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token
      });
      
      // Redirection basée sur le rôle
      // Update navigation immediately
      if (typeof window.updateNavigationVisibility === 'function') updateNavigationVisibility();
      updateNavVisibility();

      // Redirection basée sur le rôle
      if (data.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'correction.html';
      }
    } else {
      alert("Échec de l'authentification: " + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("Erreur de connexion au serveur: " + error.message);
  });
}

// Register user with Laravel backend
function registerUser(userData) {
  fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Store user data in localStorage for the new navigation system
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_role', data.user.role);
      
      // Also save to session for backward compatibility
      saveUserSession({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token
      });
      alert("Inscription réussie !");
      window.location.href = 'correction.html';
    } else {
      alert("Échec de l'inscription: " + data.message);
    }
  })
  .catch(error => {
    console.error('Fetch/register error:', error);
    alert("Erreur de connexion au serveur: " + error.message);
  });
}

// =====================
// Complaints CRUD (API)
// =====================

function requireAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  // Always use token from localStorage if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (currentUser && currentUser.token) {
    headers['Authorization'] = `Bearer ${currentUser.token}`;
  }
  return headers;
}

// Create complaint
function createComplaint(payload) {
  fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers: requireAuthHeaders(),
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`Réclamation soumise avec succès ! Numéro: ${data.complaint.reference_id}`);
      document.getElementById('complaint-form').reset();
    } else {
      alert("Échec de la soumission: " + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("Erreur de connexion au serveur");
  });
}

// List complaints (Admin)
function listComplaints(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/complaints${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: requireAuthHeaders()
  }).then(r => r.json());
}

// Update complaint status (Admin)
function updateComplaintStatus(id, status) {
  return fetch(`${API_BASE_URL}/complaints/${id}`, {
    method: 'PUT',
    headers: requireAuthHeaders(),
    body: JSON.stringify({ status })
  }).then(r => r.json());
}

// Delete complaint (Admin)
function deleteComplaint(id) {
  return fetch(`${API_BASE_URL}/complaints/${id}`, {
    method: 'DELETE',
    headers: requireAuthHeaders()
  }).then(r => r.json());
}

// Load complaints for admin
function loadComplaints() {
  fetch(`${API_BASE_URL}/complaints`, {
    method: 'GET',
    headers: requireAuthHeaders()
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      populateComplaintsTable(data.complaints);
    } else {
      alert("Erreur lors du chargement des réclamations");
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("Erreur de connexion au serveur");
  });
}

// Load complaints and dashboard stats on admin page load
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('admin.html')) {
    loadDashboardStats();
    loadComplaints();
  }
});

// Client-side debounce helper (shared)
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Client-side filtering of complaints already fetched into currentComplaints
function filterDisplayedComplaints(query) {
  const qRaw = (query || '').trim();
  const q = qRaw.toLowerCase();
  // If no query, display all
  if (!q) {
    displayComplaints(currentComplaints);
    return;
  }

  const filtered = currentComplaints.filter(c => {
    const reference = (c.reference_id || c.reference || '').toString().toLowerCase();
    const subject = (c.subject || '').toString().toLowerCase();
    const name = (c.user && c.user.name ? c.user.name : '').toString().toLowerCase();
    const type = (c.type || '').toString().toLowerCase();
    // If user typed only digits like "1001", match references containing those digits
    const digitsQuery = qRaw.replace(/\D/g, '');
    const referenceDigits = reference.replace(/\D/g, '');
    const numericMatch = digitsQuery && referenceDigits.includes(digitsQuery);
    return reference.includes(q) || numericMatch || subject.includes(q) || name.includes(q) || type.includes(q);
  });

  console.debug('filterDisplayedComplaints', { query: qRaw, total: currentComplaints.length, filtered: filtered.length });
  displayComplaints(filtered);
}

// Wire admin search input for client-side filtering (if present)
document.addEventListener('DOMContentLoaded', function() {
  if (!window.location.pathname.includes('admin.html')) return;
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  searchInput.addEventListener('input', debounce(function() {
    filterDisplayedComplaints(this.value);
  }, 200));
});

// Load dashboard stats for admin
function loadDashboardStats() {
  fetch(`${API_BASE_URL}/admin/stats`, {
    method: 'GET',
    headers: requireAuthHeaders()
  })
  .then(response => response.json())
  .then(data => {
    console.log('Dashboard stats API response:', data); // Debug log
    if (data.success && data.stats) {
      document.getElementById('totalComplaints').textContent = data.stats.total || 0;
      document.getElementById('newComplaints').textContent = data.stats.new || 0;
      document.getElementById('inProgressComplaints').textContent = data.stats.in_progress || 0;
      document.getElementById('resolvedComplaints').textContent = data.stats.resolved || 0;
    } else {
      document.getElementById('totalComplaints').textContent = '0';
      document.getElementById('newComplaints').textContent = '0';
      document.getElementById('inProgressComplaints').textContent = '0';
      document.getElementById('resolvedComplaints').textContent = '0';
    }
  })
  .catch(error => {
    console.error('Error loading dashboard stats:', error);
    document.getElementById('totalComplaints').textContent = '0';
    document.getElementById('newComplaints').textContent = '0';
    document.getElementById('inProgressComplaints').textContent = '0';
    document.getElementById('resolvedComplaints').textContent = '0';
  });
}

// Populate complaints table
function populateComplaintsTable(complaints) {
  const tbody = document.querySelector('.complaints-table tbody');
  tbody.innerHTML = ''; // Clear table
  
  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox"></td>
      <td>${complaint.reference_id}</td>
      <td>${complaint.user.name}</td>
      <td>${complaint.type}</td>
      <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
      <td><span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span></td>
      <td><span class="priority ${complaint.priority.toLowerCase()}">${complaint.priority}</span></td>
      <td>${complaint.assigned_to ? complaint.assigned_agent.name : 'Non assigné'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn respond-btn" title="Répondre" data-id="${complaint.id}">
            <i class="fas fa-reply"></i>
          </button>
          <button class="btn assign-btn" title="Assigner" data-id="${complaint.id}">
            <i class="fas fa-user-tag"></i>
          </button>
          <button class="btn view-btn" title="Détails" data-id="${complaint.id}">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Add event listeners to buttons
  attachComplaintButtonsEvents();
}

// Add event listeners to filter dropdowns
document.querySelectorAll('.filters select').forEach(select => {
  select.addEventListener('change', function() {
    loadComplaintsWithFilters();
  });
});

// Load complaints with filters
function loadComplaintsWithFilters() {
  const statusFilter = document.querySelector('select:first-child').value;
  const typeFilter = document.querySelectorAll('select')[1].value;
  const dateFilter = document.querySelectorAll('select')[2].value;
  
  const params = new URLSearchParams();
  if (statusFilter !== 'Tous') params.append('status', statusFilter);
  if (typeFilter !== 'Tous') params.append('type', typeFilter);
  if (dateFilter !== 'Tout') params.append('date_filter', dateFilter);
  
  fetch(`${API_BASE_URL}/complaints?${params}`, {
    method: 'GET',
    headers: requireAuthHeaders()
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      populateComplaintsTable(data.complaints);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Track complaint status - Géré par tracking.js
// Supprimé pour éviter les conflits avec le nouveau système de suivi

// =====================
// Validation utilities
// =====================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRequired(value, fieldName) {
  if (!value || value.trim() === '') {
    alert(`Le champ "${fieldName}" est obligatoire`);
    return false;
  }
  return true;
}

function validateMaxLength(value, maxLength, fieldName) {
  if (value && value.length > maxLength) {
    alert(`Le champ "${fieldName}" ne peut pas dépasser ${maxLength} caractères`);
    return false;
  }
  return true;
}

// =====================
// Debug and Test Functions
// =====================

// Test function to debug complaint type validation
function testComplaintTypeValidation() {
  console.log('=== Testing Complaint Type Validation ===');
  
  const selectElement = document.getElementById('complaint-type');
  if (!selectElement) {
    console.log('Complaint type select not found');
    return;
  }
  
  console.log('Select element found:', selectElement);
  console.log('Current value:', selectElement.value);
  console.log('All options:');
  
  Array.from(selectElement.options).forEach((option, index) => {
    console.log(`Option ${index}: value="${option.value}", text="${option.text}"`);
    console.log(`  Value length: ${option.value.length}`);
    console.log(`  Value char codes:`, Array.from(option.value).map(c => c.charCodeAt(0)));
  });
  
  const validTypes = ['Internet', 'Téléphonie', 'TV', 'Facturation', 'Autre'];
  console.log('Valid types from controller:', validTypes);
  
  // Test each option value
  Array.from(selectElement.options).forEach((option, index) => {
    if (option.value) { // Skip empty option
      const isValid = validTypes.includes(option.value);
      console.log(`Option "${option.value}" is valid: ${isValid}`);
    }
  });
}

// Call test function when page loads (for debugging)
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure all elements are loaded
  setTimeout(() => {
    if (window.location.pathname.includes('correction.html')) {
      testComplaintTypeValidation();
    }
  }, 1000);
});