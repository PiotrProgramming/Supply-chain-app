document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('transforge_user'));
  const githubToken = localStorage.getItem('githubToken');
  const githubRepo = localStorage.getItem('githubRepo');

  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('userName').textContent = currentUser.email.split('@')[0];
  document.getElementById('companyName').textContent = currentUser.companyName;

  if (currentUser.isAdmin) {
    document.getElementById('adminMenuItem').style.display = 'block';
  }

  loadPage('dashboard'); // Load default page

  // Setup navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadPage(item.dataset.page);
    });
  });

  // Notification badge click
  document.querySelector('.notification-badge').addEventListener('click', () => {
    loadPage('notifications');
  });

  // Load initial page content
  async function loadPage(page) {
    const response = await fetch(`pages/${page}.html`);
    const html = await response.text();
    document.getElementById('pageContent').innerHTML = html;

    if (window[page]) {
      window[page].init(); // If page has init function, call it
    }
  }
});
