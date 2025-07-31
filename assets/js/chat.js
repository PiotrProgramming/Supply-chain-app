const Chat = {
  async load() {
    this.poll();
    setInterval(() => this.poll(), 5000); // Poll every 5s
  },
  
  async poll() {
    const messages = await API.get('chat.json') || [];
    document.getElementById('chatWindow').innerHTML = messages.map(m => `<p>${m.from}: ${m.text}</p>`).join('');
  },
  
  async send() {
    const text = document.getElementById('chatMessage').value;
    const messages = await API.get('chat.json') || [];
    messages.push({ from: localStorage.getItem('token'), text, timestamp: Date.now() });
    await API.put('chat.json', messages);
    document.getElementById('chatMessage').value = '';
    this.poll();
  }
};
