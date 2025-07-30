// All JavaScript from the original script tag
// With added functionality to load content dynamically

// Content loading functions
function loadContent(page) {
    fetch(`${page}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            // Initialize page-specific JS after loading
            if(page === 'dashboard') initDashboard();
            if(page === 'drivers') initDrivers();
            if(page === 'tenders') initTenders();
            if(page === 'payments') initPayments();
            if(page === 'reports') initReports();
            if(page === 'admin') initAdmin();
        });
}

function initDashboard() {
    // Dashboard initialization code
}

function initDrivers() {
    // Drivers initialization code
}

// ... similar functions for other sections ...

// Navigation event listeners
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        loadContent(target);
    });
});

// ... rest of the original JavaScript ...
