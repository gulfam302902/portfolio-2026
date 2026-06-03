/**
 * AUTOMAZE STUDIO — CATEGORY PAGE RUNNER v3
 * Powering both legacy .html category pages and folder-based routing.
 * Dynamically resolves paths to base directories, loads category posts,
 * and serves E-E-A-T indicators and Collection Schemas.
 */
(async function() {

  const CAT_META = {
    'web-development': {
      label: 'Web Development',
      headline: 'Build websites that are fast, found, and profitable.',
      intro: `Every article here is written from real project experience. No theory for theory's sake — just practical techniques on performance, responsive code, semantic HTML, and modern frontend development that actually ships.`,
      emoji: '⚡', accent: '#5B6FFF',
      keywords: 'web development guides, custom website development, frontend development tips, responsive design, website performance',
    },
    'seo': {
      label: 'SEO & Search Performance',
      headline: 'Get found on Google. Stay there.',
      intro: `Technical SEO is about fundamentals, not tricks. This collection covers Core Web Vitals, schema markup, crawlability, semantic structure, and the content strategies that build lasting search visibility for modern businesses.`,
      emoji: '🔍', accent: '#00D4AA',
      keywords: 'technical SEO, core web vitals, schema markup, search engine optimization, SEO strategy',
    },
    'conversion-optimization': {
      label: 'Conversion Optimization',
      headline: 'More revenue from the traffic you already have.',
      intro: `Traffic without conversion is just noise. This series covers the psychology, design patterns, and UX decisions behind websites that turn visitors into customers — grounded in real conversion data and real project outcomes.`,
      emoji: '🎯', accent: '#F59E0B',
      keywords: 'conversion rate optimization, CRO, landing page optimization, UX for conversions, website conversion',
    },
    'ux-design': {
      label: 'UX Design',
      headline: 'Interfaces that make sense to real people.',
      intro: `Good UX removes friction. It's the difference between a visitor who bounces and a customer who buys. These articles cover information architecture, visual hierarchy, trust signals, and the design decisions that drive real engagement.`,
      emoji: '✨', accent: '#8B5CF6',
      keywords: 'UX design, user experience, interface design, visual hierarchy, web design principles',
    },
    'ai-web-development': {
      label: 'AI & Web Development',
      headline: 'Integrating AI to build next-generation web products.',
      intro: `Artificial Intelligence is rewriting the rules of the web. Discover practical strategies, architectures, and APIs for building and deploying intelligent, high-performance web systems.`,
      emoji: '🤖', accent: '#8B5CF6',
      keywords: 'AI web development, artificial intelligence APIs, LLM web integration, AI-powered web applications',
    },
    'local-business-growth': {
      label: 'Local Business Growth',
      headline: 'Attract more local clients and grow your business online.',
      intro: `Practical marketing, local search strategy, conversion optimization, and growth tactics specifically tailored to help local service and brick-and-mortar businesses dominate their area.`,
      emoji: '📈', accent: '#00D4AA',
      keywords: 'local SEO, small business growth, local business marketing, lead generation for local businesses',
    },
    'beginner-guides': {
      label: 'Beginner Guides',
      headline: 'Learn the fundamentals of web development step-by-step.',
      intro: `No experience required. Accessible, structured, and easy-to-follow introductory guides covering HTML, CSS, JavaScript, and essential tools to help kickstart your tech journey.`,
      emoji: '🌱', accent: '#EF4444',
      keywords: 'web development for beginners, learn HTML CSS JS, coding roadmap, beginner programming guides',
    },
  };

  const DEFAULT_META = {
    label: 'All Articles', emoji: '📝', accent: '#5B6FFF',
    headline: 'Expert articles on web development, SEO, UX, and conversion.',
    intro: 'In-depth guides written from real project experience.',
    keywords: 'web development blog, SEO tips, UX design, conversion optimization',
  };

  // Detect category slug supporting folder-based and legacy file routing
  const parts = location.pathname.split('/').filter(Boolean);
  const catIdx = parts.indexOf('category');
  const catSlug = (catIdx !== -1 && parts[catIdx + 1]) ? parts[catIdx + 1].replace('.html', '') : '';
  const meta = CAT_META[catSlug] || DEFAULT_META;

  // Determine base path: folder-based routes (category/slug/) are 2 levels deep,
  // legacy .html routes (category/slug.html) are 1 level deep from root.
  // We detect this by checking if there's a subfolder after 'category' in the path.
  const hasCatSubfolder = catIdx !== -1 && parts[catIdx + 1] && !parts[catIdx + 1].includes('.html');
  const base = hasCatSubfolder ? '../../' : '../';

  // Apply SEO metadata and schema
  if (window.SEO) {
    SEO.applyCategory(meta.label, catSlug);
    document.title = `${meta.label} Articles — Automaze Studio`;
    SEO.setMeta('keywords', meta.keywords);
    SEO.setMeta('description', meta.intro.slice(0, 160));
    
    // Inject custom structural FAQ metadata or Collection Schema
    SEO.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${meta.label} Articles — Automaze Studio`,
      description: meta.intro,
      url: `${SEO.BASE_URL}/category/${catSlug}/`,
      publisher: SEO.orgSchema(),
      breadcrumb: SEO.breadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog/' },
        { name: meta.label }
      ])
    }, 'schema-category-collection');
  }

  // Load articles from new JSON architecture
  const posts = await BlogEngine.parseBlogFile(`${base}content/blog/index.json`);
  const allCats = BlogEngine.getCategories(posts);
  const filtered = catSlug ? posts.filter(p => p.categorySlug === catSlug) : posts;
  const col = BlogEngine.getCatColor(catSlug);

  // Render HTML in the layout
  const container = document.getElementById('category-container');
  if (!container) return;

  container.innerHTML = `
    <!-- HERO -->
    <header class="page-hero" aria-labelledby="cat-heading">
      <div class="page-hero-grid" aria-hidden="true"></div>
      <div class="container" style="position:relative;z-index:1;">
        <nav class="breadcrumb" aria-label="Breadcrumb" style="margin-bottom:var(--space-6);">
          <a href="${base}index.html">Home</a>
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <a href="${base}blog/index.html">Blog</a>
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <span class="breadcrumb-current" aria-current="page">${meta.label}</span>
        </nav>
        <div style="max-width:680px;">
          <p class="section-label" style="gap:var(--space-3);">${meta.emoji} ${meta.label}</p>
          <h1 class="display-md" id="cat-heading" style="background:linear-gradient(135deg,var(--color-text-primary),${meta.accent});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${meta.headline}</h1>
          <p class="body-lg text-secondary" style="margin-top:var(--space-5);max-width:580px;">${meta.intro}</p>
          <div style="margin-top:var(--space-6);display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;">
            <span class="badge badge-neutral" style="border-color:${meta.accent}33;color:${meta.accent};">${filtered.length} ${filtered.length===1?'article':'articles'}</span>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Updated weekly</span>
          </div>
        </div>
      </div>
    </header>

    <!-- CATEGORY TABS -->
    <div style="border-bottom:1px solid var(--color-border);background:var(--color-bg-2);overflow-x:auto;">
      <div class="container">
        <nav style="display:flex;gap:var(--space-1);padding:var(--space-3) 0;min-width:max-content;" aria-label="Browse by category">
          <a href="${base}blog/index.html" class="btn btn-ghost btn-sm" id="cattab-all">All Articles</a>
          ${allCats.map(c => {
            const cc = BlogEngine.getCatColor(c.slug);
            return `
              <a href="${base}category/${c.slug}/"
                 class="btn btn-sm ${c.slug===catSlug?'btn-primary':'btn-ghost'}"
                 id="cattab-${c.slug}"
                 ${c.slug===catSlug?'aria-current="page"':''}>
                ${cc.emoji} ${c.name}
                <span style="opacity:.6;font-size:.8em;margin-left:var(--space-1);">${c.count}</span>
              </a>`;
          }).join('')}
        </nav>
      </div>
    </div>

    <!-- ARTICLES -->
    <main class="section" id="main-content">
      <div class="container">
        ${filtered.length ? `
          <!-- Featured first article -->
          ${renderFeatured(filtered[0])}

          <!-- Rest of articles -->
          ${filtered.length > 1 ? `
            <div style="margin-top:var(--space-12);">
              <p class="section-label" style="margin-bottom:var(--space-6);">All ${meta.label} Articles</p>
              <div class="blog-grid">
                ${filtered.slice(1).map((p, i) => renderCard(p, i)).join('')}
              </div>
            </div>` : ''}
        ` : `
          <div style="text-align:center;padding:var(--space-16);">
            <div style="font-size:3rem;margin-bottom:var(--space-4);" aria-hidden="true">📭</div>
            <h2 class="heading-lg" style="margin-bottom:var(--space-4);">No articles yet in this category</h2>
            <p class="body-md text-secondary" style="margin-bottom:var(--space-6);">We publish weekly — check back soon.</p>
            <a href="${base}blog/index.html" class="btn btn-primary" id="empty-back-blog">Browse All Articles</a>
          </div>`}
      </div>
    </main>

    <!-- OTHER CATEGORIES -->
    ${allCats.filter(c => c.slug !== catSlug).length ? `
    <section class="section-sm" style="background:var(--color-bg-2);border-top:1px solid var(--color-border);" aria-labelledby="other-cats-label">
      <div class="container">
        <p class="section-label" id="other-cats-label" style="justify-content:center;margin-bottom:var(--space-8);">Explore Other Topics</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4);">
          ${allCats.filter(c => c.slug !== catSlug).map(c => {
            const cc = BlogEngine.getCatColor(c.slug);
            return `
            <a href="${base}category/${c.slug}/" class="card" style="padding:var(--space-6);text-decoration:none;display:flex;flex-direction:column;gap:var(--space-3);" id="othercat-${c.slug}">
              <div style="font-size:1.6rem;" aria-hidden="true">${cc.emoji}</div>
              <div>
                <p style="font-size:var(--text-base);font-weight:var(--font-semibold);color:var(--color-text-primary);">${c.name}</p>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);">${c.count} articles</p>
              </div>
            </a>`;
          }).join('')}
        </div>
      </div>
    </section>` : ''}

    <!-- CTA -->
    <section class="section-sm" aria-label="Start a project">
      <div class="container">
        <div class="card" style="text-align:center;padding:var(--space-12);position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(91,111,255,.07),transparent);pointer-events:none;" aria-hidden="true"></div>
          <p class="section-label" style="justify-content:center;">Put the Knowledge to Work</p>
          <h2 class="heading-lg" style="margin-bottom:var(--space-3);">Ready for a Website That<br>Actually Performs?</h2>
          <p class="body-sm text-secondary" style="max-width:380px;margin:0 auto var(--space-6);">Everything in this blog comes from real projects. Let's apply it to yours.</p>
          <div style="display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap;">
            <a href="${base}contact.html" class="btn btn-primary" id="cat-cta-contact">Start a Project</a>
            <a href="${base}services.html" class="btn btn-ghost" id="cat-cta-services">Our Services</a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Trigger scroll reveals
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 60);
    });
  });

  function renderFeatured(p) {
    const col = BlogEngine.getCatColor(p.categorySlug);
    return `
      <article class="card reveal" style="padding:0;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;" aria-labelledby="featured-post-title" id="featured-post">
        <div style="padding:var(--space-10);display:flex;flex-direction:column;justify-content:space-between;gap:var(--space-6);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5);">
              <span class="badge badge-accent badge-dot">Featured</span>
              <a href="${base}category/${p.categorySlug}/" class="cat-tag">${p.category}</a>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">${p.readTime}</span>
            </div>
            <h2 style="font-size:clamp(var(--text-xl),2.5vw,var(--text-3xl));font-weight:700;letter-spacing:-.02em;line-height:1.2;margin-bottom:var(--space-4);">
              <a href="${base}blog/${p.slug}/" id="featured-post-title"
                 style="color:var(--color-text-primary);text-decoration:none;"
                 onmouseover="this.style.color='${col.accent}'" onmouseout="this.style.color='var(--color-text-primary)'">${p.title}</a>
            </h2>
            <p style="font-size:var(--text-base);color:var(--color-text-secondary);line-height:1.7;">${p.excerpt}</p>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3);">
            <time datetime="${p.date}" style="font-size:var(--text-xs);color:var(--color-text-muted);">${BlogEngine.formatDate(p.date)}</time>
            <a href="${base}blog/${p.slug}/" class="btn btn-primary btn-sm" id="featured-read-btn">Read Article →</a>
          </div>
        </div>
        <div class="featured-visual-panel" id="featured-visual-${p.id}" style="background:linear-gradient(135deg,${col.glow.replace('.3','0.12')},var(--color-surface-2));position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:260px;" aria-hidden="true">
          <div class="post-hero-grid" style="opacity:0.25;position:absolute;inset:0;"></div>
          <div style="position:absolute;width:150px;height:150px;border-radius:50%;background:${col.accent};filter:blur(50px);opacity:0.35;top:10%;left:10%;"></div>
          <div style="position:absolute;width:120px;height:120px;border-radius:50%;background:#00D4AA;filter:blur(40px);opacity:0.25;bottom:10%;right:10%;"></div>
          
          <div style="position:relative;padding:var(--space-5);border-radius:var(--radius-xl);background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);text-align:center;max-width:80%;box-shadow:var(--shadow-md);">
            <div style="font-size:3.2rem;margin-bottom:var(--space-2);filter:drop-shadow(0 4px 10px ${col.glow});">${col.emoji}</div>
            <div style="font-size:var(--text-xs);font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${col.accent};margin-bottom:var(--space-1);">${p.category}</div>
            <div style="font-size:10px;color:var(--color-text-muted);font-weight:500;letter-spacing:.1em;">AUTOMAZE EDITORIAL</div>
          </div>
          <script>
            {
              const img = new Image();
              img.src = `${base}assets/images/thumbnails/${p.slug}.webp`;
              img.onload = () => {
                const el = document.getElementById('featured-visual-${p.id}');
                if (el) el.innerHTML = \`<img src="\${img.src}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">\`;
              };
            }
          </script>
        </div>
      </article>`;
  }

  function renderCard(p, i) {
    const col = BlogEngine.getCatColor(p.categorySlug);
    return `
      <article class="card post-card reveal" style="--delay:${i*0.05}s;" id="cat-card-${p.id}" aria-labelledby="catcard-title-${p.id}">
        <div class="post-card-meta">
          <a href="${base}category/${p.categorySlug}/" class="cat-tag">${p.category}</a>
          <span class="post-card-read-time">${p.readTime}</span>
        </div>
        <a href="${base}blog/${p.slug}/" class="post-card-title" id="catcard-title-${p.id}" aria-label="Read: ${p.title}">${p.title}</a>
        <p class="post-card-excerpt">${p.excerpt}</p>
        <div class="post-card-footer">
          <time datetime="${p.date}" class="post-card-read-time">${BlogEngine.formatDate(p.date)}</time>
          <a href="${base}blog/${p.slug}/" class="post-card-arrow" aria-hidden="true">→</a>
        </div>
      </article>`;
  }

})();
