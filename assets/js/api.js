window.API = {
  async get(file) {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    if (!token || !repo) return [];

    const owner = await this.getOwner();
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
      headers: { Authorization: `token ${token}` }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return JSON.parse(atob(data.content));
  },

  async put(file, content) {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    if (!token || !repo) return;

    const owner = await this.getOwner();

    const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
      headers: { Authorization: `token ${token}` }
    });

    let sha = null;
    if (fileResponse.ok) {
      const data = await fileResponse.json();
      sha = data.sha;
    }

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update ${file}`,
        content: btoa(JSON.stringify(content)),
        sha
      })
    });
  },

  async getOwner() {
    const token = localStorage.getItem('githubToken');
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}` }
    });

    if (!res.ok) throw new Error('Invalid GitHub token');

    const user = await res.json();
    return user.login;
  }
};
