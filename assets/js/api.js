// GitHub API helper
function createGitHubAPI(token, repoName, owner) {
  return {
    async get(file) {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/data/${file}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to fetch ${file}`);
      }

      const data = await response.json();
      return JSON.parse(atob(data.content));
    },

    async put(file, content) {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/data/${file}`;
      let sha = null;

      // Check if file exists
      try {
        const response = await fetch(url, {
          headers: { Authorization: `token ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          sha = data.sha;
        }
      } catch (err) {
        console.log(`File ${file} doesn't exist yet`);
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${file}`,
          content: btoa(JSON.stringify(content)),
          sha,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${file}`);
      }
    },
  };
}
