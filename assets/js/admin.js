const Admin = {
  async load() {
    if (localStorage.getItem('role') !== 'admin') return alert('Access Denied');
    const users = await API.get('users.json') || [];
    document.getElementById('userTree').innerHTML = users.map(u => `<div>${u.email} (${u.role})</div>`).join('');
  },
  
  async createUser() {
    const email = prompt('New User Email');
    const users = await API.get('users.json') || [];
    users.push({ id: Date.now().toString(), email, role: 'user' /* add hierarchy */ });
    await API.put('users.json', users);
    this.load();
  }
};
