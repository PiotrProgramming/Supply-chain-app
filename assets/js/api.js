const API = {
  async get(file) {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    if (!token || !repo) return JSON.parse(localStorage.getItem(`transforge_data_${file}`) || '[]');

    const res = await fetch(`https://api.github.com/repos/${await this.getOwner()}/${repo}/contents/data/${file}`, {
      headers: { Authorization: `token ${token}` }
    });
    const data = await res.json();
    return JSON.parse(atob(data.content));
  },

  async put(file, content) {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    if (!token || !repo) {
      localStorage.setItem(`transforge_data_${file}`, JSON.stringify(content));
      return;
    }

    const owner = await this.getOwner();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, {
      method: 'GET',
      headers: { Authorization: `token ${token}` }
    }).catch(() => null);

    const sha = res?.ok ? (await res.json()).sha : null;

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}` },
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
    const user = await res.json();
    return user.login;
  }
};
