window.drivers = {
  drivers: [],

  init() {
    this.loadDrivers();
  },

  async loadDrivers() {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    const owner = await getGitHubOwner(token);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/drivers.json`, {
      headers: { Authorization: `token ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      this.drivers = JSON.parse(atob(data.content));
      this.renderDrivers();
    } else {
      console.error('Failed to load drivers');
    }
  },

  renderDrivers() {
    const list = document.getElementById('driverList');
    list.innerHTML = this.drivers.map(driver => `
      <div class="driver-card">
        <h3>${driver.name}</h3>
        <p>Status: <span class="status ${driver.status}">${driver.status}</span></p>
        <p>Vehicle: ${driver.vehicle || 'None'}</p>
        <button onclick="drivers.editDriver('${driver.id}')">Edit</button>
      </div>
    `).join('');
  },

  async createDriver() {
    const name = prompt('Enter driver name');
    if (!name) return;

    const newDriver = {
      id: Date.now(),
      name: name,
      status: 'Available',
      cards: [],
      vehicle: null
    };

    this.drivers.push(newDriver);
    await this.saveDrivers();
    this.renderDrivers();
  },

  async editDriver(id) {
    const driver = this.drivers.find(d => d.id === parseInt(id));
    if (!driver) return;

    const newStatus = prompt('Enter new status', driver.status);
    if (newStatus) {
      driver.status = newStatus;
      await this.saveDrivers();
      this.renderDrivers();
    }
  },

  async saveDrivers() {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    const owner = await getGitHubOwner(token);

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/drivers.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `token ${token}` },
      body: JSON.stringify({
        message: 'Update drivers',
        content
