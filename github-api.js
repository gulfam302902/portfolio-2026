class GitHubCMS {
  constructor(token, owner, repo, branch = 'main') {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  }

  async request(method, endpoint, body = null) {
    const headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${endpoint}`, options);
    if (!res.ok) {
      let err;
      try { err = await res.json(); } catch(e) {}
      throw new Error(`GitHub API Error (${res.status}): ${err ? err.message : res.statusText}`);
    }
    return res.json();
  }

  async getFile(path) {
    try {
      const data = await this.request('GET', `/contents/${path}?ref=${this.branch}`);
      if (data.content) {
        // Handle utf-8 decoding properly for base64
        return decodeURIComponent(escape(atob(data.content)));
      }
      return null;
    } catch(e) {
      if (e.message.includes('404')) return null;
      throw e;
    }
  }

  async getFileSHA(path) {
    try {
      const data = await this.request('GET', `/contents/${path}?ref=${this.branch}`);
      return data.sha;
    } catch(e) {
      if (e.message.includes('404')) return null;
      throw e;
    }
  }

  // Commits multiple files at once using the Git Database API
  // files: array of { path: string, content: string, encoding: 'utf-8' | 'base64' }
  async commitFiles(commitMessage, files) {
    // 1. Get reference to branch to get the latest commit SHA
    const refData = await this.request('GET', `/git/ref/heads/${this.branch}`);
    const latestCommitSha = refData.object.sha;

    // 2. Get the commit to get the tree SHA
    const commitData = await this.request('GET', `/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for each file and build the tree array
    const tree = [];
    for (const file of files) {
      const blobData = await this.request('POST', `/git/blobs`, {
        content: file.content,
        encoding: file.encoding || 'utf-8'
      });
      tree.push({
        path: file.path,
        mode: '100644', // file (blob)
        type: 'blob',
        sha: blobData.sha
      });
    }

    // 4. Create a new tree
    const newTreeData = await this.request('POST', `/git/trees`, {
      base_tree: baseTreeSha,
      tree: tree
    });

    // 5. Create a new commit
    const newCommitData = await this.request('POST', `/git/commits`, {
      message: commitMessage,
      tree: newTreeData.sha,
      parents: [latestCommitSha]
    });

    // 6. Update the reference
    await this.request('PATCH', `/git/refs/heads/${this.branch}`, {
      sha: newCommitData.sha,
      force: false
    });

    return newCommitData.sha;
  }
}

window.GitHubCMS = GitHubCMS;
