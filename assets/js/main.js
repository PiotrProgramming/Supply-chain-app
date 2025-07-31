// Include HTML templates (simple fetch-based)
document.querySelectorAll('[include-html]').forEach(el => {
  fetch(el.getAttribute('include-html'))
    .then(res => res.text())
    .then(html => el.innerHTML = html);
});

// Simple router to load subpages into #content
function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('content').innerHTML = html;
    });
}

// On dashboard load, show basic stats (fetch from GitHub)
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    // Fetch stats
    API.get('drivers.json').then(drivers => document.getElementById('totalDrivers').textContent = drivers.length);
    API.get('tenders.json').then(tenders => document.getElementById('pendingTenders').textContent = tenders.filter(t => t.status === 'pending').length);
  } else {
    window.location.href = 'index.html';
  }
});
