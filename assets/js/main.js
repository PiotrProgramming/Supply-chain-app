document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('transforge_user');
  if (!user) {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
      window.location.href = 'login.html';
    }
    return;
  }

  const userData = JSON.parse(user);
  document.getElementById('appContainer').style.display = 'flex';
  document.getElementById('appCompanyName').textContent = userData.companyName;
  document.getElementById('companyNameDisplay').textContent = userData.companyName;
  document.getElementById('userName').textContent = userData.email.split('@')[0];

  if (userData.isAdmin) {
    document.getElementById('adminMenuItem').style.display = 'flex';
  }

  loadPage('dashboard');
  Notifications?.load();
});

function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('pageContent').innerHTML = html;
      if (window[page.charAt(0).toUpperCase() + page.slice(1)]?.load) {
        window[page.charAt(0).toUpperCase() + page.slice(1)].load();
      }
    })
    .catch(err => {
      document.getElementById('pageContent').innerHTML = `
        <div class="error">Error loading page: ${err.message}</div>
      `;
    });
}
