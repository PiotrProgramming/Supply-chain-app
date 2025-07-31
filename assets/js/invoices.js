const Invoices = {
  async load() {
    const invoices = await API.get('invoices.json') || [];
    const table = document.getElementById('invoicesTable');
    table.innerHTML = invoices.map(i => `<tr><td>${i.client}</td><td>${i.amount}</td><td>${i.dueDate}</td><td>${i.status}</td><td><button onclick="Invoices.remind('${i.id}')">Remind</button></td></tr>`).join('');
  },
  
  async create() {
    const client = prompt('Client Name');
    const invoices = await API.get('invoices.json') || [];
    invoices.push({ id: Date.now().toString(), client, amount: 0, dueDate: '', status: 'pending' });
    await API.put('invoices.json', invoices);
    this.load();
  },
  
  remind(id) {
    // Simulate notification send
    alert(`Reminder sent for invoice ${id}`);
  }
};
