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
    
    if (token && userRole === 'admin') {
        // User is logged in and is admin
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userNav) userNav.style.display = 'inline-block';
        if (userName) userName.textContent = localStorage.getItem('user_name') || 'Admin';
        
        // Show admin navigation items
        if (adminNavItem) adminNavItem.style.display = 'block';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'block';
        
    } else if (token) {
        // User is logged in but not admin
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userNav) userNav.style.display = 'inline-block';
        if (userName) userName.textContent = localStorage.getItem('user_name') || 'User';
        
        // Hide admin navigation items
        if (adminNavItem) adminNavItem.style.display = 'none';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'none';
        
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userNav) userNav.style.display = 'none';
        
        // Hide admin navigation items
        if (adminNavItem) adminNavItem.style.display = 'none';
        if (mobileAdminNavItem) mobileAdminNavItem.style.display = 'none';
    }
}

// Update navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateNavigationVisibility();
});

// Update navigation when localStorage changes (e.g., after login/logout)
window.addEventListener('storage', function(e) {
    if (e.key === 'auth_token' || e.key === 'user_role') {
        updateNavigationVisibility();
    }
});

// Function to handle logout
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        window.location.href = 'login.html';
    }
}
