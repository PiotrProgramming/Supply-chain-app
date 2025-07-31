

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const user = localStorage.getItem('transforge_user');
  if (!user && !window.location.pathname.includes('login.html') && 
      !window.location.pathname.includes('register.html') && 
      !window.location.pathname.includes('github-setup.html')) {
    window.location.href = 'login.html';
    return;
  }
  
  if (user && (window.location.pathname.includes('login.html') || 
               window.location.pathname.includes('register.html') || 
               window.location.pathname.includes('github-setup.html'))) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Dashboard only setup
  if (user) {
    const userData = JSON.parse(user);
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('appCompanyName').textContent = userData.companyName;
    document.getElementById('companyNameDisplay').textContent = userData.companyName;
    document.getElementById('userName').textContent = userData.email.split('@')[0];
    
    if (userData.isAdmin) {
      document.getElementById('adminMenuItem').style.display = 'flex';
    }
    
    // Load initial page
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'dashboard';
    loadPage(page);
    Notifications.load();
  }
});

function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error(`Page not found: ${page}`);
      return res.text();
    })
    .then(html => {
      document.getElementById('pageContent').innerHTML = html;
      if (window[page.charAt(0).toUpperCase() + page.slice(1)]?.load) {
        window[page.charAt(0).toUpperCase() + page.slice(1)].load();
      }
      
      // Update active menu item
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
          item.classList.add('active');
        }
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById('pageContent').innerHTML = `
        <div class="card">
          <h2>Error</h2>
          <p>Failed to load page: ${err.message}</p>
          <button onclick="loadPage('dashboard')" class="btn btn-primary">Go to Dashboard</button>
        </div>
      `;
    });
}

// Ensure API is defined
if (typeof window.API === 'undefined') {
    window.API = {
        async get(file) {
            return JSON.parse(localStorage.getItem(`transforge_data_${file}`) || '[]');
        },
        async put(file, content) {
            localStorage.setItem(`transforge_data_${file}`, JSON.stringify(content));
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('transforge_user');
    if (!user) {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') && 
            !window.location.pathname.includes('github-setup.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Rest of your dashboard initialization code...
});
