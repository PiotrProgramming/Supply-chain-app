const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Replace with your PAT
const REPO_OWNER = 'YOUR_REPO_OWNER'; // e.g., 'yourusername'
const REPO_NAME = 'transforge-data'; // Your data repo
const BASE_PATH = 'data/';

const API = {
  async get(file) {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}${file}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const data = await res.json();
    return JSON.parse(atob(data.content));
  },
  
  async put(file, content) {
    const existing = await this.get(file).catch(() => null);
    const sha = existing ? existing.sha : null;
    
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}${file}`, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Update ${file}`,
        content: btoa(JSON.stringify(content)),
        sha
      })
    });
    return res.json();
  }
};
