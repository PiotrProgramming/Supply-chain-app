document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const token = document.getElementById('githubToken').value.trim();
  const repoName = document.getElementById('repoName').value.trim();

  if (!email || !password || !token || !repoName) {
    alert('All fields are required');
    return;
  }

  try {
    // Save token and repo name
    localStorage.setItem('githubToken', token);
    localStorage.setItem('githubRepo', repoName);

    // Get GitHub owner (username)
    const owner = await getGitHubOwner(token);

    // Initialize API
    const api = createGitHubAPI(token, repoName, owner);

    // Fetch users from GitHub
    const users = await api.get('users.json');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      alert('Invalid credentials or no user found in repository');
      return;
    }

    // Save user session
    localStorage.setItem('transforge_user', JSON.stringify(user));

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed: ' + error.message);
  }
}

async function handleRegistration(e) {
  e.preventDefault();

  const companyName = document.getElementById('regCompanyName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const token = document.getElementById('regGitHubToken').value.trim();
  const repoName = document.getElementById('regRepoName').value.trim();

  if (!companyName || !email || !password || !token || !repoName) {
    alert('All fields are required');
    return;
  }

  try {
    // Save token and repo name
    localStorage.setItem('githubToken', token);
    localStorage.setItem('githubRepo', repoName);

    // Get GitHub owner (username)
    const owner = await getGitHubOwner(token);

    // Check if repo exists
    const repoExists = await checkGitHubRepo(owner, repoName, token);

    if (!repoExists) {
      await createGitHubRepo(owner, repoName, token);
    }

    // Initialize API
    const api = createGitHubAPI(token, repoName, owner);

    // Save new user
    const users = await api.get('users.json').catch(() => []);
    const newUser = {
      email,
      password,
      companyName,
      isAdmin: true,
    };
    users.push(newUser);
    await api.put('users.json', users);

    // Save user session
    localStorage.setItem('transforge_user', JSON.stringify(newUser));

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Registration failed:', error);
    alert('Registration failed: ' + error.message);
  }
}

// Helper Functions
async function getGitHubOwner(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}` },
  });
  if (!response.ok) throw new Error('Invalid GitHub token');
  const user = await response.json();
  return user.login;
}

async function checkGitHubRepo(owner, repoName, token) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: { Authorization: `token ${token}` },
  });
  return response.ok;
}

async function createGitHubRepo(owner, repoName, token) {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      private: true,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create repository');
  }

  // Wait for repo to initialize
  await new Promise(resolve => setTimeout(resolve, 3000);
}
