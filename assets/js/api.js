document.addEventListener('DOMContentLoaded', () => {
  window.API = {
    async get(file) {
      // Try GitHub first
      const token = localStorage.getItem('githubToken');
      const repo = localStorage.getItem('githubRepo');
      
      if (token && repo) {
        try {
          const owner = await this.getOwner();
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, {
            headers: { Authorization: `token ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            return JSON.parse(atob(data.content));
          }
        } catch (err) {
          console.log(`GitHub get failed for ${file}:`, err);
        }
      }
      
      // Fall back to local storage
      return JSON.parse(localStorage.getItem(`transforge_data_${file}`) || '[]');
    },

    async put(file, content) {
      // Try GitHub first
      const token = localStorage.getItem('githubToken');
      const repo = localStorage.getItem('githubRepo');
      
      if (token && repo) {
        try {
          const owner = await this.getOwner();
          let sha = null;
          
          try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, {
              headers: { Authorization: `token ${token}` }
            });
            
            if (res.ok) {
              const data = await res.json();
              sha = data.sha;
            }
          } catch (err) {
            console.log(`File ${file} doesn't exist yet`);
          }
          
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, {
            method: 'PUT',
            headers: { 
              Authorization: `token ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Update ${file}`,
              content: btoa(JSON.stringify(content)),
              sha: sha
            })
          });
          
          if (res.ok) {
            return; // Success with GitHub
          }
        } catch (err) {
          console.log(`GitHub put failed for ${file}:`, err);
        }
      }
      
      // Fall back to local storage
      localStorage.setItem(`transforge_data_${file}`, JSON.stringify(content));
    },

    async getOwner() {
      const token = localStorage.getItem('githubToken');
      if (!token) throw new Error('No GitHub token');
      
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      
      if (!res.ok) throw new Error('Invalid GitHub token');
      
      const user = await res.json();
      return user.login;
    }
  };
});
