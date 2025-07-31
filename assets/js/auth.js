// Placeholder hash function (use bcrypt.js for real)
function hashPassword(pw) {
  return btoa(pw); // Simple base64 - NOT SECURE
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pw = hashPassword(document.getElementById('loginPassword').value);
  
  const users = await API.get('users.json');
  const user = users.find(u => u.email === email && u.password === pw);
  
  if (user) {
    localStorage.setItem('token', user.id); // Simple token
    localStorage.setItem('role', user.role);
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid credentials');
  }
});

document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const pw = hashPassword(document.getElementById('regPassword').value);
  const company = document.getElementById('regCompany').value;
  
  const users = await API.get('users.json') || [];
  const newUser = { id: Date.now().toString(), email, password: pw, role: 'admin', company };
  users.push(newUser);
  
  await API.put('users.json', users);
  alert('Registered! Now login.');
});
