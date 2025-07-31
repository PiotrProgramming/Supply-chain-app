document.addEventListener('DOMContentLoaded', () => {
  // Toggle between login and registration
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'flex';
  });

  document.getElementById('backToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pw = document.getElementById('loginPassword').value;

    try {
      const users = await API.get('users.json');
      const user = users.find(u => u.email === email && u.password === pw);
      
      if (user) {
        localStorage.setItem('transforge_user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Check console for details.');
    }
  });

  // Register form
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const companyName = document.getElementById('regCompanyName').value;
    const email = document.getElementById('regEmail').value;
    const pw = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;

    if (pw !== confirm) {
      alert('Passwords do not match');
      return;
    }

    // Save for GitHub setup
    localStorage.setItem('pendingUser', JSON.stringify({ 
      companyName, 
      email, 
      password: pw 
    }));
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('githubSetupPage').style.display = 'flex';
  });

  // GitHub Setup
  document.getElementById('setupGitHubBtn').addEventListener('click', async () => {
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('repoName').value.trim();

    if (!token || !repo) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createRepoAndInitFiles(token, repo);
      localStorage.setItem('githubToken', token);
      localStorage.setItem('githubRepo', repo);

      const pendingUser = JSON.parse(localStorage.getItem('pendingUser'));
      pendingUser.isAdmin = true;

      // Save user
      const users = await API.get('users.json');
      users.push(pendingUser);
      await API.put('users.json', users);

      localStorage.setItem('transforge_user', JSON.stringify(pendingUser));
      localStorage.removeItem('pendingUser');
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('GitHub setup failed:', err);
      alert(`Error: ${err.message || 'Failed to create repository'}`);
    }
  });

  document.getElementById('skipForNow').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const pendingUser = JSON.parse(localStorage.getItem('pendingUser'));
      pendingUser.isAdmin = true;
      pendingUser.localOnly = true;

      // Use local storage
      const users = JSON.parse(localStorage.getItem('transforge_data_users') || '[]');
      users.push(pendingUser);
      localStorage.setItem('transforge_data_users', JSON.stringify(users));
      localStorage.setItem('transforge_user', JSON.stringify(pendingUser));
      localStorage.removeItem('pendingUser');
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Local setup failed:', err);
      alert('Failed to create local account');
    }
  });

  // Create GitHub repo and files
  async function createRepoAndInitFiles(token, repoName) {
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    try {
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) throw new Error('Invalid GitHub token');
      const user = await userRes.json();
      const owner = user.login;

      // Create repo
      const repoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          name: repoName, 
          private: true,
          auto_init: true,
          gitignore_template: "Node"
        })
      });
      
      if (!repoRes.ok) throw new Error('Failed to create repository');
      
      const files = [
        'users.json', 'drivers.json', 'vehicles.json', 'tenders.json',
        'invoices.json', 'reports.json', 'chat.json', 'notifications.json'
      ];

      for (const file of files) {
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/data/${file}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Initial commit: ${file}`,
            content: btoa('[]')
          })
        });
      }
    } catch (err) {
      console.error('GitHub operation failed:', err);
      throw err;
    }
  }

  function openTokenGuide() {
    alert('1. Go to GitHub Settings → Developer Settings → Personal Access Tokens\n\n' +
          '2. Click "Generate new token" (classic)\n\n' +
          '3. Select "repo" scope\n\n' +
          '4. Copy the generated token');
  }
});
