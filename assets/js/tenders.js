const Tenders = {
  async load() {
    const tenders = await API.get('tenders.json') || [];
    const table = document.getElementById('tendersTable');
    table.innerHTML = tenders.map(t => `<tr><td>${t.loadDate}</td><td>${t.place}</td><td>${t.status}</td><td><button onclick="Tenders.edit('${t.id}')">Edit</button></td></tr>`).join('');
  },
  
  async create() {
    const loadDate = prompt('Load Date');
    const tenders = await API.get('tenders.json') || [];
    tenders.push({ id: Date.now().toString(), loadDate, status: 'pending' /* add other fields */ });
    await API.put('tenders.json', tenders);
    this.load();
  },
  
  handleDrop(event) {
    // Handle file drop (simulate upload to GitHub as base64 or link)
    alert('Document dropped');
  },
  
  edit(id) {
    // Implement
  }
};
