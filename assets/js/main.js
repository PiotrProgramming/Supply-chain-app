document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = localStorage.getItem('transforge_user');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    const userData = JSON.parse(user);
    document.getElementById('appCompanyName').textContent = userData.companyName;
    document.getElementById('userName').textContent = userData.email.split('@')[0];
    
    if (userData.isAdmin) {
        document.getElementById('adminMenuItem').style.display = 'flex';
    }

    // Load initial page
    loadPage('dashboard');
});

function loadPage(page) {
    fetch(`pages/${page}.html`)
        .then(res => res.text())
        .then(html => {
            document.getElementById('pageContent').innerHTML = html;
            // Initialize page-specific JS if it exists
            if (window[page.charAt(0).toUpperCase() + page.slice(1)]?.init) {
                window[page.charAt(0).toUpperCase() + page.slice(1)].init();
            }
        })
        .catch(err => {
            console.error('Failed to load page:', err);
            document.getElementById('pageContent').innerHTML = `
                <div class="error-message">
                    <h3>Error loading page</h3>
                    <p>${err.message}</p>
                    <button onclick="loadPage('dashboard')">Return to Dashboard</button>
                </div>
            `;
        });
}
