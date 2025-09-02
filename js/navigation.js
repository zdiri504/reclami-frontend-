// Navigation management script
// This script handles showing/hiding navigation elements based on user authentication and role

function updateNavigationVisibility() {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');

    // Get navigation elements
    const adminNavItem = document.getElementById('admin-nav-item');
    const mobileAdminNavItem = document.getElementById('mobile-admin-nav-item');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNav = document.getElementById('user-nav');
    const userName = document.getElementById('user-name');

    // Get correction/suivi nav list items if they exist
    const correctionNav = document.querySelector('nav a[href="correction.html"]')?.parentElement || null;
    const suiviNav = document.querySelector('nav a[href="suivi.html"]')?.parentElement || null;
    // Get all "À propos" links (desktop + mobile) so we can hide them for admins
    const aproposLinks = Array.from(document.querySelectorAll('nav a[href="apropos.html"]')) || [];

    // Default hide/show behavior
    function showLogin() { if (loginBtn) loginBtn.style.display = 'inline-block'; }
    function hideLogin() { if (loginBtn) loginBtn.style.display = 'none'; }
    function showLogout() { if (logoutBtn) logoutBtn.style.display = 'inline-block'; }
    function hideLogout() { if (logoutBtn) logoutBtn.style.display = 'none'; }
    function showUserNav() { if (userNav) userNav.style.display = 'inline-block'; }
    function hideUserNav() { if (userNav) userNav.style.display = 'none'; }

    if (token && userRole === 'admin') {
        // Admin user
        hideLogin();
        showLogout();
        showUserNav();
        if (userName) userName.textContent = localStorage.getItem('user_name') || 'Admin';

        if (adminNavItem) adminNavItem.style.display = 'block';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'block';

        // Admin should not see correction/suivi
        if (correctionNav) correctionNav.style.display = 'none';
        if (suiviNav) suiviNav.style.display = 'none';
        // Admin should not see À propos
        aproposLinks.forEach(a => {
            const parent = a.parentElement;
            if (parent) parent.style.display = 'none'; else a.style.display = 'none';
        });

    } else if (token) {
        // Authenticated non-admin user (client)
        hideLogin();
        showLogout();
        showUserNav();
        if (userName) userName.textContent = localStorage.getItem('user_name') || 'Utilisateur';

        // Hide admin links
        if (adminNavItem) adminNavItem.style.display = 'none';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'none';

        // Ensure correction/suivi visible
        if (correctionNav) correctionNav.style.display = '';
        if (suiviNav) suiviNav.style.display = '';
        // Ensure À propos visible for non-admin authenticated users
        aproposLinks.forEach(a => {
            const parent = a.parentElement;
            if (parent) parent.style.display = ''; else a.style.display = '';
        });

    } else {
        // Guest
        showLogin();
        hideLogout();
        hideUserNav();

        // Hide admin links
        if (adminNavItem) adminNavItem.style.display = 'none';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'none';

        // Show correction/suivi to guests
        if (correctionNav) correctionNav.style.display = '';
        if (suiviNav) suiviNav.style.display = '';
        // Show À propos to guests
        aproposLinks.forEach(a => {
            const parent = a.parentElement;
            if (parent) parent.style.display = ''; else a.style.display = '';
        });
    }
}

// Update navigation when page loads and enforce login requirement
document.addEventListener('DOMContentLoaded', function() {
    // If the app requires authentication for all pages, redirect guests to login
    const token = localStorage.getItem('auth_token');
    const allowedUnauthPages = ['login.html', 'register.html', 'reset-password.html'];
    const path = window.location.pathname;
    const page = (path.substring(path.lastIndexOf('/') + 1) || 'index.html').toLowerCase();

    if (!token && !allowedUnauthPages.includes(page)) {
        // Avoid redirect loop if already on login
        if (page !== 'login.html') {
            window.location.href = 'login.html';
            return;
        }
    }

    updateNavigationVisibility();
});

// Update navigation when localStorage changes (e.g., after login/logout)
window.addEventListener('storage', function(e) {
    if (e.key === 'auth_token' || e.key === 'user_role' || e.key === 'user_name') {
        updateNavigationVisibility();
    }
});

// Function to handle logout
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    // Clear localStorage tokens used by navigation
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    // Clear legacy session storage used by script.js
    try { sessionStorage.removeItem('currentUser'); } catch (e) { /* ignore */ }
    // Update navigation in this tab immediately
    if (typeof window.updateNavigationVisibility === 'function') updateNavigationVisibility();
    try { if (typeof window.updateNavVisibility === 'function') updateNavVisibility(); } catch (e) { /* ignore */ }
    // Redirect to login page to show only the login screen
    window.location.href = 'login.html';
    }
}
