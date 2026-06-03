// Automaze Studio Admin App
let cms = null;
let blogIndex = [];
let currentThumbnailBase64 = null;

// --- INITIALIZATION ---
function init() {
  // Bind Nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const linkEl = e.currentTarget || e.target;
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      linkEl.classList.add('active');
      const target = linkEl.getAttribute('data-target');
      
      document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + target).classList.add('active');
      document.getElementById('view-title').textContent = linkEl.textContent;
      
      const btnSave = document.getElementById('btn-save-post');
      btnSave.style.display = target === 'new-post' ? 'block' : 'none';
      
      if (target === 'dashboard') renderDashboard();
      if (target === 'articles') renderArticles();
      if (target === 'media-manager') window.MediaManager.init();
    });
  });

  // Load Settings
  const token = localStorage.getItem('gh_token');
  const owner = localStorage.getItem('gh_owner');
  const repo = localStorage.getItem('gh_repo');
  const branch = localStorage.getItem('gh_branch') || 'main';

  if (token && owner && repo) {
    document.getElementById('gh-token').value = token;
    document.getElementById('gh-owner').value = owner;
    document.getElementById('gh-repo').value = repo;
    document.getElementById('gh-branch').value = branch;
    
    cms = new GitHubCMS(token, owner, repo, branch);
    window.cms = cms;
    document.getElementById('github-status').className = 'status-badge success';
    document.getElementById('github-status').innerHTML = 'GitHub: Connected';
    
    loadBlogIndex();
  }

  // Settings Save
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    localStorage.setItem('gh_token', document.getElementById('gh-token').value);
    localStorage.setItem('gh_owner', document.getElementById('gh-owner').value);
    localStorage.setItem('gh_repo', document.getElementById('gh-repo').value);
    localStorage.setItem('gh_branch', document.getElementById('gh-branch').value);
    document.getElementById('settings-msg').textContent = 'Settings saved! Reloading...';
    setTimeout(() => location.reload(), 1000);
  });

  // Editor bind
  document.getElementById('post-title').addEventListener('input', e => {
    if(!document.getElementById('post-slug').dataset.manual) {
      document.getElementById('post-slug').value = window.BlogEngine.toSlug(e.target.value);
    }
  });
  document.getElementById('post-slug').addEventListener('input', e => {
    e.target.dataset.manual = 'true';
  });

  // Image Upload to WebP
  document.getElementById('post-thumbnail').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const webpBase64 = await convertToWebP(file);
    currentThumbnailBase64 = webpBase64.split(',')[1]; // remove data:image/webp;base64,
    const preview = document.getElementById('thumbnail-preview');
    preview.src = webpBase64;
    preview.style.display = 'block';
  });

  document.getElementById('thumbnail-upload-box').addEventListener('click', () => {
    document.getElementById('post-thumbnail').click();
  });

  document.getElementById('btn-save-post').addEventListener('click', handleSavePost);
}

// --- DATA LOADING ---
async function loadBlogIndex() {
  try {
    const rawIndex = await cms.getFile('content/blog/index.json');
    if (rawIndex) {
      blogIndex = JSON.parse(rawIndex);
    }
    renderDashboard();
    renderArticles();
  } catch(e) {
    console.error("Failed to load blog index via API, trying local fetch...", e);
    try {
      const res = await fetch('../content/blog/index.json');
      blogIndex = await res.json();
      renderDashboard();
      renderArticles();
    } catch(err) {
      console.error("Local fetch failed too.", err);
    }
  }
}

// --- RENDER VIEWS ---
function renderDashboard() {
  document.getElementById('stat-total').textContent = blogIndex.length;
  document.getElementById('stat-published').textContent = blogIndex.filter(p => p.published).length;
  document.getElementById('stat-drafts').textContent = blogIndex.filter(p => !p.published).length;
  document.getElementById('stat-cats').textContent = new Set(blogIndex.map(p => p.category)).size;

  const recent = blogIndex.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById('dashboard-recent').innerHTML = `
    <table class="admin-table">
      ${recent.map(p => `<tr><td>${p.title}</td><td>${window.BlogEngine.formatDate(p.date)}</td></tr>`).join('')}
    </table>
  `;
}

function renderArticles() {
  const tbody = document.getElementById('articles-tbody');
  tbody.innerHTML = blogIndex.map(p => `
    <tr>
      <td style="font-weight:600;">${p.title}</td>
      <td><span style="background:rgba(255,255,255,0.1);padding:4px 8px;border-radius:4px;font-size:12px;">${p.category}</span></td>
      <td>${window.BlogEngine.formatDate(p.date)}</td>
      <td>${p.published ? '<span style="color:#00D4AA;">Published</span>' : '<span style="color:#F59E0B;">Draft</span>'}</td>
      <td><button class="btn btn-ghost btn-sm">Edit</button></td>
    </tr>
  `).join('');
}

// --- EDITOR ACTIONS ---
function formatDoc(cmd, value=null) { document.execCommand(cmd, false, value); }
function insertLink() {
  const url = prompt("Enter the link here: ", "http://");
  if (url) document.execCommand("createLink", false, url);
}
function toggleHtml() {
  const content = document.getElementById('post-content');
  const html = document.getElementById('post-html');
  if (content.style.display !== 'none') {
    html.value = content.innerHTML;
    content.style.display = 'none';
    html.style.display = 'block';
  } else {
    content.innerHTML = html.value;
    html.style.display = 'none';
    content.style.display = 'block';
  }
}

// --- IMAGE TO WEBP ---
function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- SITEMAP UPDATER ---
function updateSitemapXML(xmlString, newPost) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const urlset = xmlDoc.documentElement;
  const newLoc = `https://automazestudio.com/blog/${newPost.slug}/`;
  
  const locs = xmlDoc.getElementsByTagName("loc");
  for (let i=0; i<locs.length; i++) {
    if (locs[i].textContent === newLoc) {
      const urlNode = locs[i].parentNode;
      let lastmodNode = urlNode.getElementsByTagName("lastmod")[0];
      if (lastmodNode) lastmodNode.textContent = newPost.date;
      return new XMLSerializer().serializeToString(xmlDoc);
    }
  }

  const urlNode = xmlDoc.createElement("url");
  const locNode = xmlDoc.createElement("loc"); locNode.textContent = newLoc; urlNode.appendChild(locNode);
  const lastmodNode = xmlDoc.createElement("lastmod"); lastmodNode.textContent = newPost.date; urlNode.appendChild(lastmodNode);
  const cfNode = xmlDoc.createElement("changefreq"); cfNode.textContent = "monthly"; urlNode.appendChild(cfNode);
  const prioNode = xmlDoc.createElement("priority"); prioNode.textContent = "0.6"; urlNode.appendChild(prioNode);
  urlset.appendChild(urlNode);
  
  return new XMLSerializer().serializeToString(xmlDoc);
}

// --- SAVE & PUBLISH ---
async function handleSavePost() {
  if (!cms) return alert('GitHub not configured!');
  
  const btn = document.getElementById('btn-save-post');
  btn.textContent = 'Publishing...';
  btn.disabled = true;

  try {
    const title = document.getElementById('post-title').value;
    const slug = document.getElementById('post-slug').value || window.BlogEngine.toSlug(title);
    const category = document.getElementById('post-category').value || 'General';
    const date = document.getElementById('post-date').value || new Date().toISOString().split('T')[0];
    const published = document.getElementById('post-published').checked;
    
    const contentHtml = document.getElementById('post-html').style.display === 'none' 
      ? document.getElementById('post-content').innerHTML 
      : document.getElementById('post-html').value;
    
    // We store HTML directly instead of Markdown for simplicity in this V1
    const content = contentHtml;
    
    // Always initialize tempDiv to safely parse text content from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content || '';
    if (!tempDiv) {
      throw new Error('Content parser failed');
    }
    const plainTextContent = tempDiv.textContent;

    let excerpt = document.getElementById('post-excerpt').value;
    if (!excerpt) {
      excerpt = window.BlogEngine.makeExcerpt(plainTextContent);
    }

    const categorySlug = window.BlogEngine.toSlug(category);
    const col = window.BlogEngine.getCatColor(categorySlug);
    const faqs = window.BlogEngine.extractFAQs(plainTextContent);
    const quickAnswer = window.BlogEngine.extractQuickAnswer(plainTextContent);
    
    // In our JSON schema, we just store full post object
    const postObj = {
      id: Date.now(),
      title, slug, category, categorySlug,
      content, excerpt,
      readTime: window.BlogEngine.readingTime(plainTextContent),
      toc: [], 
      date,
      wordCount: plainTextContent.split(/\s+/).length,
      faqs, quickAnswer, tags: [category],
      accentColor: col.accent, glowColor: col.glow, emoji: col.emoji,
      featured: false, published
    };

    const indexObj = {
      id: postObj.id, title, slug, category, categorySlug, excerpt,
      readTime: postObj.readTime, date, wordCount: postObj.wordCount,
      emoji: col.emoji, featured: false, published
    };

    // Update index array
    const existingIdx = blogIndex.findIndex(p => p.slug === slug);
    if (existingIdx > -1) blogIndex[existingIdx] = indexObj;
    else blogIndex.push(indexObj);

    const filesToCommit = [];

    // 1. Post JSON
    filesToCommit.push({
      path: `content/blog/${slug}.json`,
      content: JSON.stringify(postObj, null, 2),
      encoding: 'utf-8'
    });

    // 2. Index JSON
    filesToCommit.push({
      path: `content/blog/index.json`,
      content: JSON.stringify(blogIndex, null, 2),
      encoding: 'utf-8'
    });

    // 3. Image
    if (currentThumbnailBase64) {
      filesToCommit.push({
        path: `assets/images/thumbnails/${slug}.webp`,
        content: currentThumbnailBase64,
        encoding: 'base64'
      });
    }

    // 4. Sitemap
    const oldSitemap = await cms.getFile('sitemap.xml');
    if (oldSitemap && published) {
      const newSitemap = updateSitemapXML(oldSitemap, postObj);
      filesToCommit.push({
        path: 'sitemap.xml',
        content: newSitemap,
        encoding: 'utf-8'
      });
    }

    // Commit
    await cms.commitFiles(`CMS: Publish ${slug}`, filesToCommit);

    alert('Published successfully! Cloudflare Pages is now redeploying.');
    
    btn.textContent = 'Save & Publish';
    btn.disabled = false;
    
  } catch(e) {
    console.error('Publish Error:', e);
    alert('Error saving post: ' + e.message);
    btn.textContent = 'Save & Publish';
    btn.disabled = false;
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
