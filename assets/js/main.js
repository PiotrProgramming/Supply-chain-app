// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('transforge_user') || '{}');
  document.getElementById('userEmail').textContent = user.email || 'User';
  document.getElementById('companyName').textContent = user.companyName || 'Your Company';

  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (!page) return;

      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      loadPage(page);
    })
  );

  // Load default page
  loadPage('dashboard');
});

function loadPage(pageName) {
  fetch(`pages/${pageName}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('pageContainer').innerHTML = html;
      const pageTitle = pageName[0].toUpperCase() + pageName.slice(1);
      document.getElementById('pageTitle').textContent = pageTitle;

      // Dynamically load page module if it exists
      if (window[pageName] && typeof window[pageName].init === 'function') {
        window[pageName].init();
      }
    });
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
