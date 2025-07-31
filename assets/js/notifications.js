const Notifications = {
  async load() {
    const notifs = await API.get('notifications.json') || [];
    // Update bell count
    document.getElementById('notifCount').textContent = notifs.length;
  },
  
  async loadFull() {
    const notifs = await API.get('notifications.json') || [];
    document.getElementById('notificationsList').innerHTML = notifs.map(n => `<li>${n.message}</li>`).join('');
  }
};

// Load on dashboard init
document.addEventListener('DOMContentLoaded', () => Notifications.load());
