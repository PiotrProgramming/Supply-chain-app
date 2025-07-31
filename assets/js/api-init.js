function createGitHubAPI(token, repo) {
    return {
        async get(file) {
            try {
                // First get the owner (username/organization)
                const ownerResponse = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${token}` }
                });
                const ownerData = await ownerResponse.json();
                const owner = ownerData.login;

                // Then get the file content
                const response = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, 
                    {
                        headers: { 'Authorization': `token ${token}` }
                    }
                );

                if (!response.ok) {
                    if (response.status === 404) return [];
                    throw new Error(`Failed to fetch ${file}`);
                }

                const data = await response.json();
                return JSON.parse(atob(data.content));
            } catch (error) {
                console.error('API GET error:', error);
                // Fallback to local storage
                return JSON.parse(localStorage.getItem(`transforge_data_${file}`) || '[]');
            }
        },

        async put(file, content) {
            try {
                // First get the owner (username/organization)
                const ownerResponse = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${token}` }
                });
                const ownerData = await ownerResponse.json();
                const owner = ownerData.login;

                // Check if file exists to get SHA
                let sha = null;
                try {
                    const existingResponse = await fetch(
                        `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, 
                        {
                            headers: { 'Authorization': `token ${token}` }
                        }
                    );
                    if (existingResponse.ok) {
                        const existingData = await existingResponse.json();
                        sha = existingData.sha;
                    }
                } catch (err) {
                    // File doesn't exist yet
                }

                // Create/update the file
                const response = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`, 
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Update ${file}`,
                            content: btoa(JSON.stringify(content)),
                            sha: sha
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to update ${file}`);
                }
            } catch (error) {
                console.error('API PUT error:', error);
                // Fallback to local storage
                localStorage.setItem(`transforge_data_${file}`, JSON.stringify(content));
            }
        }
    };
}

// Initialize API when page loads
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');
    
    if (token && repo) {
        window.API = createGitHubAPI(token, repo);
    } else {
        // Fallback to local storage API
        window.API = {
            async get(file) {
                return JSON.parse(localStorage.getItem(`transforge_data_${file}`) || '[]');
            },
            async put(file, content) {
                localStorage.setItem(`transforge_data_${file}`, JSON.stringify(content));
            }
        };
    }
});
