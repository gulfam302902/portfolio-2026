// Automaze Studio Admin Panel — Media Manager & Site Assets System

const MediaManager = (() => {
  let imagesList = []; // list of images: { path, filename, folder, size, dimensions, sha }
  let usageMap = {};    // image path -> array of strings (where used)
  let siteSettings = {}; // contents of site-settings.json
  let mediaIndex = {};   // contents of media-index.json
  
  // Cropper state
  let currentFile = null;
  let cropperRatio = 1.91; // width / height
  let targetWidth = 1200;
  let targetHeight = 630;
  let targetPath = '';
  let bypassCrop = false;
  let currentAction = 'upload'; // 'upload' or 'replace'
  let targetCategory = 'library';

  // Cropper movement state
  let isDragging = false;
  let isResizing = false;
  let activeHandle = null;
  let startX, startY, startLeft, startTop, startWidth, startHeight;

  // Configuration for Site Assets & sections
  const ASSETS_CONFIG = {
    branding: [
      { key: 'logo', label: 'Logo', path: 'assets/images/logo.svg', dims: '150x50 (SVG/WebP)', ratio: null, targetDims: null },
      { key: 'favicon', label: 'Favicon', path: 'assets/images/favicon.svg', dims: '32x32 (SVG/PNG/ICO)', ratio: 1, targetDims: { w: 32, h: 32 } },
      { key: 'ogImage', label: 'Open Graph Image', path: 'assets/images/og-image.jpg', dims: '1200x630', ratio: 1.91, targetDims: { w: 1200, h: 630 } },
      { key: 'defaultBlog', label: 'Default Blog Thumbnail', path: 'assets/images/default-blog.webp', dims: '1200x630', ratio: 1.91, targetDims: { w: 1200, h: 630 } },
      { key: 'defaultCaseStudy', label: 'Default Case Study Image', path: 'assets/images/default-case-study.webp', dims: '1600x900', ratio: 1.777, targetDims: { w: 1600, h: 900 } },
      { key: 'defaultPortfolio', label: 'Default Portfolio Image', path: 'assets/images/default-portfolio.webp', dims: '1600x900', ratio: 1.777, targetDims: { w: 1600, h: 900 } }
    ],
    homepage: [
      { key: 'hero', label: 'Hero Image', path: 'assets/images/homepage/hero.webp', dims: '1920x1080', ratio: 1.777, targetDims: { w: 1920, h: 1080 } },
      { key: 'feature1', label: 'Feature Section 1', path: 'assets/images/homepage/feature-1.webp', dims: '800x600', ratio: 1.33, targetDims: { w: 800, h: 600 } },
      { key: 'feature2', label: 'Feature Section 2', path: 'assets/images/homepage/feature-2.webp', dims: '800x600', ratio: 1.33, targetDims: { w: 800, h: 600 } },
      { key: 'feature3', label: 'Feature Section 3', path: 'assets/images/homepage/feature-3.webp', dims: '800x600', ratio: 1.33, targetDims: { w: 800, h: 600 } },
      { key: 'cta', label: 'CTA Section Image', path: 'assets/images/homepage/cta.webp', dims: '1920x1080', ratio: 1.777, targetDims: { w: 1920, h: 1080 } }
    ]
  };

  const DEFAULT_SETTINGS = {
    siteTitle: 'Automaze Studio',
    siteDescription: 'Automaze Studio builds high-converting, SEO-optimized websites for modern businesses. Premium web development, editorial content, and UX-focused digital experiences.',
    defaultMetaTitle: 'Automaze Studio — Premium Web Development Agency',
    defaultMetaDescription: 'Automaze Studio builds high-converting, SEO-optimized websites for modern businesses. Premium web development, editorial content, and UX-focused digital experiences.',
    defaultOgImage: 'assets/images/og-image.jpg',
    googleAnalyticsId: '',
    googleSearchConsole: '',
    bingVerification: '',
    organizationSchema: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Automaze Studio",\n  "url": "https://automazestudio.com",\n  "logo": "https://automazestudio.com/assets/images/logo.svg"\n}`
  };

  // --- INITIALIZATION ---
  async function init() {
    bindUIEvents();
    await loadSettings();
    await loadMedia();
  }

  function bindUIEvents() {
    // Section tabs routing
    document.querySelectorAll('#media-tabs-list .btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('#media-tabs-list .btn').forEach(b => b.classList.remove('btn-active'));
        e.target.classList.add('btn-active');
        
        const tab = e.target.getAttribute('data-tab');
        document.querySelectorAll('.media-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`sec-${tab}`).classList.add('active');
      });
    });

    // Search & filter inside library
    document.getElementById('library-search').addEventListener('input', filterLibraryGrid);
    document.getElementById('library-filter').addEventListener('change', filterLibraryGrid);

    // Standard library upload file selector
    document.getElementById('library-upload-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      currentAction = 'upload';
      targetCategory = document.getElementById('library-filter').value;
      if (targetCategory === 'all') targetCategory = 'library';
      promptCropAndUpload(file, `assets/images/${targetCategory}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, 1.91, { w: 1200, h: 630 });
    });

    // Copy URL helper in details modal
    document.getElementById('btn-copy-url').addEventListener('click', () => {
      const path = document.getElementById('detail-path').textContent;
      const fullUrl = `${window.location.origin}/${path}`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        const btn = document.getElementById('btn-copy-url');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Image URL', 1500);
      });
    });

    // Replace Image button in details modal
    document.getElementById('btn-replace-image').addEventListener('click', () => {
      const path = document.getElementById('detail-path').textContent;
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        currentAction = 'replace';
        targetPath = path;
        
        // Find configuration for aspect ratios
        let ratio = 1.91;
        let dims = { w: 1200, h: 630 };
        
        // Search in branding configuration
        const brandItem = ASSETS_CONFIG.branding.find(i => i.path === path);
        if (brandItem) {
          ratio = brandItem.ratio;
          dims = brandItem.targetDims;
        } else {
          // Search homepage config
          const homeItem = ASSETS_CONFIG.homepage.find(i => i.path === path);
          if (homeItem) {
            ratio = homeItem.ratio;
            dims = homeItem.targetDims;
          }
        }
        
        document.getElementById('details-modal').classList.remove('active');
        promptCropAndUpload(file, path, ratio, dims);
      };
      fileInput.click();
    });

    // Delete image handler
    document.getElementById('btn-delete-image').addEventListener('click', async () => {
      const path = document.getElementById('detail-path').textContent;
      const usages = usageMap[path] || [];
      if (usages.length > 0) {
        alert(`Cannot delete this image! It is currently in use in: \n\n• ${usages.join('\n• ')}`);
        return;
      }
      
      if (!confirm(`Are you sure you want to permanently delete this image from the repository?\n${path}`)) return;
      
      const btn = document.getElementById('btn-delete-image');
      btn.textContent = 'Deleting...';
      btn.disabled = true;

      try {
        if (!cms) throw new Error('GitHub not configured!');
        
        // We delete by committing a tree change that doesn't contain this file,
        // or by pushing a delete request to contents API.
        // In our case, the easiest way to delete a single file is the GitHub contents API DELETE request.
        const sha = await cms.getFileSHA(path);
        if (!sha) throw new Error('File SHA not found on repository.');
        
        await cms.request('DELETE', `/contents/${path}`, {
          message: `CMS: Delete image ${path}`,
          sha: sha,
          branch: cms.branch
        });

        // Remove from local mediaIndex
        if (mediaIndex[path]) {
          delete mediaIndex[path];
          const files = [{
            path: 'content/media-index.json',
            content: JSON.stringify(mediaIndex, null, 2),
            encoding: 'utf-8'
          }];
          await cms.commitFiles('CMS: Update media index after delete', files);
        }

        alert('Image deleted successfully!');
        document.getElementById('details-modal').classList.remove('active');
        await loadMedia();
      } catch(e) {
        console.error("Delete Error:", e);
        alert('Failed to delete image: ' + e.message);
      } finally {
        btn.textContent = 'Delete';
        btn.disabled = false;
      }
    });

    // Bind cropper drag-and-drop / movement listeners
    const cropBox = document.getElementById('crop-box');
    cropBox.addEventListener('mousedown', startCropInteraction);
    cropBox.addEventListener('touchstart', startCropInteraction, { passive: false });

    document.addEventListener('mousemove', moveCropInteraction);
    document.addEventListener('touchmove', moveCropInteraction, { passive: false });

    document.addEventListener('mouseup', endCropInteraction);
    document.addEventListener('touchend', endCropInteraction);

    // Bind SEO form submission
    document.getElementById('btn-save-seo').addEventListener('click', saveSEOSettings);
  }

  // --- LOAD & SAVE SETTINGS ---
  async function loadSettings() {
    try {
      let raw = null;
      if (cms) {
        raw = await cms.getFile('content/site-settings.json');
      }
      
      if (!raw) {
        // Fallback to fetch local site-settings if not in repo yet
        const res = await fetch('../content/site-settings.json');
        if (res.ok) raw = await res.text();
      }

      if (raw) {
        siteSettings = JSON.parse(raw);
      } else {
        siteSettings = { ...DEFAULT_SETTINGS };
      }
    } catch(e) {
      console.warn("Could not load site settings, using defaults.", e);
      siteSettings = { ...DEFAULT_SETTINGS };
    }

    // Populate SEO Panel fields
    document.getElementById('seo-site-title').value = siteSettings.siteTitle || '';
    document.getElementById('seo-site-desc').value = siteSettings.siteDescription || '';
    document.getElementById('seo-meta-title').value = siteSettings.defaultMetaTitle || '';
    document.getElementById('seo-meta-desc').value = siteSettings.defaultMetaDescription || '';
    document.getElementById('seo-default-og').value = siteSettings.defaultOgImage || '';
    document.getElementById('seo-ga-id').value = siteSettings.googleAnalyticsId || '';
    document.getElementById('seo-gsc-token').value = siteSettings.googleSearchConsole || '';
    document.getElementById('seo-bing-token').value = siteSettings.bingVerification || '';
    document.getElementById('seo-schema-org').value = siteSettings.organizationSchema || '';
  }

  async function saveSEOSettings() {
    const btn = document.getElementById('btn-save-seo');
    const msg = document.getElementById('seo-settings-msg');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    msg.textContent = '';

    try {
      if (!cms) throw new Error('GitHub configuration is required to save settings.');

      siteSettings.siteTitle = document.getElementById('seo-site-title').value;
      siteSettings.siteDescription = document.getElementById('seo-site-desc').value;
      siteSettings.defaultMetaTitle = document.getElementById('seo-meta-title').value;
      siteSettings.defaultMetaDescription = document.getElementById('seo-meta-desc').value;
      siteSettings.defaultOgImage = document.getElementById('seo-default-og').value;
      siteSettings.googleAnalyticsId = document.getElementById('seo-ga-id').value;
      siteSettings.googleSearchConsole = document.getElementById('seo-gsc-token').value;
      siteSettings.bingVerification = document.getElementById('seo-bing-token').value;
      siteSettings.organizationSchema = document.getElementById('seo-schema-org').value;

      const files = [{
        path: 'content/site-settings.json',
        content: JSON.stringify(siteSettings, null, 2),
        encoding: 'utf-8'
      }];

      await cms.commitFiles('CMS: Update site and SEO settings', files);
      msg.style.color = 'var(--color-teal)';
      msg.textContent = 'Settings saved successfully! Redeploying website...';
    } catch(e) {
      console.error(e);
      msg.style.color = 'var(--color-error)';
      msg.textContent = 'Error: ' + e.message;
    } finally {
      btn.textContent = 'Save SEO Settings';
      btn.disabled = false;
    }
  }

  // --- LOAD MEDIA ---
  async function loadMedia() {
    // Render placeholders
    renderPlaceholders();

    if (!cms) {
      console.warn("GitHub not configured — running in offline preview mode.");
      return;
    }

    try {
      // 1. Crawl usage map
      usageMap = await scanImageUsage();

      // 2. Fetch repository files recursively
      const treeData = await cms.request('GET', `/git/trees/${cms.branch}?recursive=true`);
      const repoFiles = treeData.tree || [];

      // Filter to assets/images
      const imageFiles = repoFiles.filter(f => {
        return f.type === 'blob' && 
               f.path.startsWith('assets/images/') && 
               /\.(webp|png|jpg|jpeg|svg|gif|ico)$/i.test(f.path);
      });

      // 3. Load media-index.json for metadata cache
      const rawIndex = await cms.getFile('content/media-index.json');
      if (rawIndex) {
        mediaIndex = JSON.parse(rawIndex);
      } else {
        mediaIndex = {};
      }

      // 4. Map files and identify folder
      imagesList = [];
      for (const file of imageFiles) {
        // Extract folder
        const parts = file.path.split('/');
        let folder = 'library';
        if (parts.length > 2) {
          folder = parts[parts.length - 2];
        }
        if (parts.length === 2) {
          folder = 'branding';
        }

        // Get size
        const sizeKB = file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown';

        // Retrieve dimensions and date from index, or default
        let dims = 'Unknown';
        let dateStr = new Date().toISOString().split('T')[0];
        
        if (mediaIndex[file.path]) {
          dims = mediaIndex[file.path].dimensions || 'Unknown';
          dateStr = mediaIndex[file.path].uploadDate || dateStr;
        }

        imagesList.push({
          path: file.path,
          filename: parts[parts.length - 1],
          folder: folder,
          size: sizeKB,
          dimensions: dims,
          uploadDate: dateStr,
          sha: file.sha
        });
      }

      // Render actual grids
      renderGrids();
    } catch(e) {
      console.error("Failed to load media list:", e);
    }
  }

  function renderPlaceholders() {
    const list = document.querySelectorAll('.assets-grid, .library-grid');
    list.forEach(g => {
      g.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--color-text-secondary);">
          <span style="font-size:32px;">🔄</span><br>Loading media library from GitHub...
        </div>
      `;
    });
  }

  // --- RENDER CARD GRIDS ---
  function renderGrids() {
    // 1. Site Assets
    renderConfigSection('site-assets', ASSETS_CONFIG.branding);

    // 2. Homepage Images
    renderConfigSection('homepage', ASSETS_CONFIG.homepage);

    // 3. Services (Assets in services folder)
    renderFolderGrid('services', 'services');

    // 4. Portfolio
    renderFolderGrid('portfolio', 'portfolio');

    // 5. Case Studies
    renderFolderGrid('case-studies', 'case-studies');

    // 6. Blog Images
    renderFolderGrid('blog', 'thumbnails');

    // 7. Central Library
    filterLibraryGrid();
  }

  function renderConfigSection(tabId, configList) {
    const grid = document.getElementById(`grid-${tabId}`);
    grid.innerHTML = configList.map(item => {
      const img = imagesList.find(i => i.path === item.path);
      const usages = usageMap[item.path] || [];
      const usageLabel = usages.length > 0 ? `<span class="usage-badge in-use">In-Use (${usages.length})</span>` : `<span class="usage-badge unused">Unused</span>`;
      
      const fileUrl = img ? `../${item.path}?t=${Date.now()}` : '../assets/images/fallback.svg';
      const sizeStr = img ? img.size : 'Not Found';
      const dimsStr = img ? img.dimensions : 'Not Found';

      return `
        <div class="asset-card">
          <div class="asset-title">
            <span>${item.label}</span>
            ${usageLabel}
          </div>
          <div class="asset-preview-box">
            <img src="${fileUrl}" onerror="this.src='../assets/images/fallback.svg'">
          </div>
          <div class="asset-info">
            <span class="dimension-badge">Recommended: ${item.dims}</span>
            <span>File Path: <code>${item.path}</code></span>
            <span>Dimensions: ${dimsStr}</span>
            <span>Size: ${sizeStr}</span>
          </div>
          <div class="asset-actions">
            <button class="btn btn-ghost" onclick="MediaManager.previewImage('${item.path}')">Preview</button>
            <button class="btn btn-primary" onclick="MediaManager.triggerUploadBox('${item.path}', ${item.ratio}, ${item.targetDims ? JSON.stringify(item.targetDims) : 'null'})">Replace</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFolderGrid(tabId, folderName) {
    const grid = document.getElementById(`grid-${tabId}`);
    const files = imagesList.filter(i => i.folder === folderName);
    
    if (files.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:24px; color:var(--color-text-muted);">No images found in <code>assets/images/${folderName}/</code>.</div>`;
      return;
    }

    grid.innerHTML = files.map(file => {
      const usages = usageMap[file.path] || [];
      const inUse = usages.length > 0;
      
      return `
        <div class="asset-card">
          <div class="asset-title">
            <span style="font-size:13px; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.filename}</span>
            ${inUse ? '<span class="usage-badge in-use">In-Use</span>' : '<span class="usage-badge unused">Unused</span>'}
          </div>
          <div class="asset-preview-box" style="height:120px;">
            <img src="../${file.path}?t=${Date.now()}" onerror="this.src='../assets/images/fallback.svg'">
          </div>
          <div class="asset-info">
            <span>Dimensions: ${file.dimensions}</span>
            <span>Size: ${file.size}</span>
          </div>
          <div class="asset-actions">
            <button class="btn btn-ghost btn-sm" onclick="MediaManager.showDetails('${file.path}')">Manage</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function filterLibraryGrid() {
    const search = document.getElementById('library-search').value.toLowerCase();
    const filter = document.getElementById('library-filter').value;
    const grid = document.getElementById('grid-library');

    let filtered = imagesList.filter(img => img.filename.toLowerCase().includes(search));
    
    if (filter !== 'all') {
      const folderName = filter === 'blog' ? 'thumbnails' : filter;
      filtered = filtered.filter(img => img.folder === folderName);
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--color-text-muted);">No matching images found.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(file => {
      return `
        <div class="library-card" onclick="MediaManager.showDetails('${file.path}')">
          <img src="../${file.path}?t=${Date.now()}" onerror="this.src='../assets/images/fallback.svg'">
          <div class="library-card-overlay">
            <p class="library-card-title">${file.filename}</p>
            <p class="library-card-meta">${file.dimensions} | ${file.size}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- TRIGGER ACTIONS & DETAIL MODALS ---
  function previewImage(path) {
    const fullUrl = `${window.location.origin}/${path}`;
    window.open(fullUrl, '_blank');
  }

  function triggerUploadBox(path, ratio, targetDims) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      currentAction = 'replace';
      promptCropAndUpload(file, path, ratio, targetDims);
    };
    fileInput.click();
  }

  function showDetails(path) {
    const img = imagesList.find(i => i.path === path);
    if (!img) return;

    const usages = usageMap[path] || [];

    document.getElementById('detail-img').src = `../${img.path}?t=${Date.now()}`;
    document.getElementById('detail-name').textContent = img.filename;
    document.getElementById('detail-path').textContent = img.path;
    document.getElementById('detail-dims').textContent = img.dimensions;
    document.getElementById('detail-size').textContent = img.size;
    document.getElementById('detail-date').textContent = img.uploadDate;
    document.getElementById('detail-usage').textContent = usages.length > 0 ? usages.join(', ') : 'Not in use';
    
    // Wire replace buttons
    document.getElementById('details-modal').classList.add('active');
  }

  // --- CROPPER ENGINE ---
  function promptCropAndUpload(file, path, ratio, dims) {
    currentFile = file;
    targetPath = path;
    cropperRatio = ratio;
    bypassCrop = false;

    if (dims) {
      targetWidth = dims.w;
      targetHeight = dims.h;
      document.getElementById('cropper-dims').textContent = `Target size: ${targetWidth}x${targetHeight} px`;
    } else {
      targetWidth = null;
      targetHeight = null;
      document.getElementById('cropper-dims').textContent = 'Flexible dimensions';
    }

    const reader = new FileReader();
    reader.onload = e => {
      const modal = document.getElementById('cropper-modal');
      const img = document.getElementById('cropper-img');
      img.src = e.target.result;
      
      img.onload = () => {
        setupCropperUI(ratio);
        modal.classList.add('active');
      };
    };
    reader.readAsDataURL(file);
  }

  function setupCropperUI(ratio) {
    const img = document.getElementById('cropper-img');
    const wrapper = document.getElementById('cropper-wrapper');
    const cropBox = document.getElementById('crop-box');

    // Make sure wrapper matches image visual dimensions
    wrapper.style.width = img.clientWidth + 'px';
    wrapper.style.height = img.clientHeight + 'px';

    if (!ratio) {
      // SVG / Flexible, hide crop boundaries
      cropBox.style.display = 'none';
      bypassCrop = true;
      return;
    }

    cropBox.style.display = 'block';

    // Calculate crop initial dimensions
    let w, h;
    const maxW = img.clientWidth;
    const maxH = img.clientHeight;

    if (maxW / maxH > ratio) {
      h = maxH * 0.8;
      w = h * ratio;
    } else {
      w = maxW * 0.8;
      h = w / ratio;
    }

    cropBox.style.width = Math.round(w) + 'px';
    cropBox.style.height = Math.round(h) + 'px';
    cropBox.style.left = Math.round((maxW - w) / 2) + 'px';
    cropBox.style.top = Math.round((maxH - h) / 2) + 'px';
  }

  function startCropInteraction(e) {
    isDragging = false;
    isResizing = false;
    activeHandle = null;

    const cropBox = document.getElementById('crop-box');
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (e.target.classList.contains('crop-handle')) {
      isResizing = true;
      activeHandle = e.target;
    } else if (e.target === cropBox) {
      isDragging = true;
    }

    if (isDragging || isResizing) {
      startX = clientX;
      startY = clientY;
      startLeft = cropBox.offsetLeft;
      startTop = cropBox.offsetTop;
      startWidth = cropBox.offsetWidth;
      startHeight = cropBox.offsetHeight;
      e.preventDefault();
    }
  }

  function moveCropInteraction(e) {
    if (!isDragging && !isResizing) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const dx = clientX - startX;
    const dy = clientY - startY;

    const wrapper = document.getElementById('cropper-wrapper');
    const cropBox = document.getElementById('crop-box');
    const maxW = wrapper.clientWidth;
    const maxH = wrapper.clientHeight;

    if (isDragging) {
      let left = startLeft + dx;
      let top = startTop + dy;
      
      if (left < 0) left = 0;
      if (top < 0) top = 0;
      if (left + cropBox.offsetWidth > maxW) left = maxW - cropBox.offsetWidth;
      if (top + cropBox.offsetHeight > maxH) top = maxH - cropBox.offsetHeight;
      
      cropBox.style.left = left + 'px';
      cropBox.style.top = top + 'px';
    } else if (isResizing) {
      let newW = startWidth;
      let newH = startHeight;

      if (activeHandle.classList.contains('handle-br')) {
        newW = startWidth + dx;
        newH = newW / cropperRatio;
      } else if (activeHandle.classList.contains('handle-bl')) {
        newW = startWidth - dx;
        newH = newW / cropperRatio;
      } else if (activeHandle.classList.contains('handle-tr')) {
        newW = startWidth + dx;
        newH = newW / cropperRatio;
      } else if (activeHandle.classList.contains('handle-tl')) {
        newW = startWidth - dx;
        newH = newW / cropperRatio;
      }

      if (newW > 40 && newW <= maxW && newH <= maxH) {
        // Horizontal boundary checks
        let left = startLeft;
        if (activeHandle.classList.contains('handle-bl') || activeHandle.classList.contains('handle-tl')) {
          left = startLeft + (startWidth - newW);
        }

        // Vertical boundary checks
        let top = startTop;
        if (activeHandle.classList.contains('handle-tl') || activeHandle.classList.contains('handle-tr')) {
          top = startTop + (startHeight - newH);
        }

        if (left >= 0 && (left + newW) <= maxW && top >= 0 && (top + newH) <= maxH) {
          cropBox.style.width = Math.round(newW) + 'px';
          cropBox.style.height = Math.round(newH) + 'px';
          cropBox.style.left = Math.round(left) + 'px';
          cropBox.style.top = Math.round(top) + 'px';
        }
      }
    }
    e.preventDefault();
  }

  function endCropInteraction() {
    isDragging = false;
    isResizing = false;
    activeHandle = null;
  }

  function closeCropper() {
    document.getElementById('cropper-modal').classList.remove('active');
  }

  function bypassCropper() {
    bypassCrop = true;
    applyCrop();
  }

  async function applyCrop() {
    const btn = document.querySelector('#cropper-modal .btn-primary');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      if (!cms) throw new Error('GitHub configuration is missing!');
      let webpBase64 = '';
      let outputWidth = targetWidth;
      let outputHeight = targetHeight;

      if (bypassCrop || !cropperRatio) {
        // Commit image exactly as it is (converted to WebP if needed)
        // Check if SVG or ICO
        if (currentFile.name.endsWith('.svg') || currentFile.name.endsWith('.ico')) {
          // Commit raw SVG or ICO
          const rawBase64 = await readFileAsBase64(currentFile);
          webpBase64 = rawBase64.split(',')[1];
          outputWidth = 0;
          outputHeight = 0;
        } else {
          // Standard image WebP conversion
          const dataUrl = await convertToWebP(currentFile);
          webpBase64 = dataUrl.split(',')[1];
          
          // Detect size
          const dimsObj = await getImageSize(currentFile);
          outputWidth = dimsObj.w;
          outputHeight = dimsObj.h;
        }
      } else {
        // Perform Canvas crop
        const img = document.getElementById('cropper-img');
        const cropBox = document.getElementById('crop-box');
        
        // Calculate crop coords relative to original image size
        const scaleX = img.naturalWidth / img.clientWidth;
        const scaleY = img.naturalHeight / img.clientHeight;

        const sx = cropBox.offsetLeft * scaleX;
        const sy = cropBox.offsetTop * scaleY;
        const sw = cropBox.offsetWidth * scaleX;
        const sh = cropBox.offsetHeight * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth || 1200;
        canvas.height = targetHeight || 630;
        const ctx = canvas.getContext('2d');
        
        // Layout Protection: Draw canvas inside and fill background
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        
        webpBase64 = canvas.toDataURL('image/webp', 0.82).split(',')[1];
      }

      // Setup path for commits
      // Ensure folder structure path exists
      const targetBase = targetPath.toLowerCase().endsWith('.svg') ? targetPath : targetPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      const files = [{
        path: targetBase,
        content: webpBase64,
        encoding: 'base64'
      }];

      // Save dimensions and size into media-index.json
      const sizeBytes = Math.round((webpBase64.length * 3) / 4);
      mediaIndex[targetBase] = {
        dimensions: outputWidth && outputHeight ? `${outputWidth}x${outputHeight}` : 'Flexible',
        uploadDate: new Date().toISOString().split('T')[0]
      };

      files.push({
        path: 'content/media-index.json',
        content: JSON.stringify(mediaIndex, null, 2),
        encoding: 'utf-8'
      });

      // Commit to GitHub
      await cms.commitFiles(`CMS: Save image asset ${targetBase}`, files);
      
      alert('Asset committed successfully! Deploying modifications...');
      closeCropper();
      await loadMedia();
    } catch(e) {
      console.error(e);
      alert('Failed to save image asset: ' + e.message);
    } finally {
      btn.textContent = 'Crop & Save';
      btn.disabled = false;
    }
  }

  // --- HELPERS ---
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function getImageSize(file) {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = e => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = e.target.result;
      };
      r.readAsDataURL(file);
    });
  }

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

  // Crawl client-side file usage
  async function scanImageUsage() {
    const usage = {};
    const pages = [
      'index.html', 'about.html', 'services.html', 'contact.html', 
      'case-studies/index.html', 'blog/index.html', 'blog/post.html',
      'privacy.html', 'terms.html', 'disclaimer.html', 'cookies.html'
    ];
    
    // Fetch local files recursively
    for (const page of pages) {
      try {
        const res = await fetch('../' + page);
        if (res.ok) {
          const html = await res.text();
          // Find standard image assets strings
          const matches = html.match(/assets\/images\/[a-zA-Z0-9_\-\.\/]+/g) || [];
          matches.forEach(m => {
            const cleanPath = m.replace(/['"\)\s]/g, '').trim();
            if (cleanPath.endsWith('.') || cleanPath.length < 15) return;
            if (!usage[cleanPath]) usage[cleanPath] = new Set();
            
            let pName = page.replace('.html', '').replace('/index', '');
            pName = pName.charAt(0).toUpperCase() + pName.slice(1);
            if (pName === '') pName = 'Home';
            usage[cleanPath].add(pName);
          });
        }
      } catch(e) {
        console.warn("Failed to check page: " + page);
      }
    }

    // Scan site settings logo/favicon
    try {
      const res = await fetch('../content/site-settings.json');
      if (res.ok) {
        const set = await res.json();
        const brandingKeys = ['logo', 'favicon', 'ogImage', 'defaultBlog', 'defaultCaseStudy', 'defaultPortfolio'];
        brandingKeys.forEach(k => {
          const path = set[k];
          if (path) {
            if (!usage[path]) usage[path] = new Set();
            usage[path].add(`Branding: ${k}`);
          }
        });
      }
    } catch(e) {}

    // Scan blog article thumbnails
    try {
      const res = await fetch('../content/blog/index.json');
      if (res.ok) {
        const list = await res.json();
        list.forEach(post => {
          const thumb = `assets/images/thumbnails/${post.slug}.webp`;
          if (!usage[thumb]) usage[thumb] = new Set();
          usage[thumb].add(`Blog: ${post.title.substring(0, 25)}...`);
        });
      }
    } catch(e) {}

    // Convert sets to arrays
    const finalMap = {};
    for (const path in usage) {
      finalMap[path] = Array.from(usage[path]);
    }
    return finalMap;
  }

  return {
    init,
    loadMedia,
    previewImage,
    triggerUploadBox,
    showDetails,
    closeCropper,
    bypassCropper,
    applyCrop
  };
})();

// Export globally
window.MediaManager = MediaManager;
