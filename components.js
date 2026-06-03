/**
 * AUTOMAZE STUDIO — COMPONENTS
 * Injects Navbar + Footer, handles scroll state, mobile menu, reading progress.
 */
const COMPONENT_SCRIPT = document.currentScript;

/* ============================================================
   SITE CONFIG
   ============================================================ */
const SITE = {
  name:      'Automaze Studio',
  tagline:   'Premium Web Development Agency',
  baseUrl:   'https://automazestudio.com',
  email:     'hello@automazestudio.com',
  whatsapp:  'https://wa.me/message/automazestudio',
  linkedin:  'https://linkedin.com/in/automazestudio',
  instagram: 'https://instagram.com/automazestudio',
};

function getBasePath() {
  if (window.location.protocol.startsWith('http')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const isFile = parts.length > 0 && (parts[parts.length - 1].includes('.') || parts[parts.length - 1] === 'post' || parts[parts.length - 1] === 'category');
    const depth = isFile ? parts.length - 1 : parts.length;
    return '../'.repeat(depth) || './';
  }
  if (COMPONENT_SCRIPT) {
    const src = COMPONENT_SCRIPT.getAttribute('src') || '';
    const match = src.match(/(\.\.\/)/g);
    return match ? match.join('') : './';
  }
  return './';
}

/* ============================================================
   NAVBAR
   ============================================================ */
function renderNavbar() {
  const base = getBasePath();
  const nav  = document.createElement('nav');
  nav.id = 'navbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="${base}index.html" class="nav-logo" aria-label="Automaze Studio Home">
        <div class="nav-logo-mark" aria-hidden="true">A</div>
        <span class="nav-logo-name">Automaze<span> Studio</span></span>
      </a>

      <ul class="nav-links" role="list">
        <li><a href="${base}index.html" id="nav-home">Home</a></li>

        <li class="nav-dropdown">
          <a href="${base}services.html" id="nav-services">
            Services
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </a>
          <div class="nav-dropdown-menu" role="menu">
            <a href="${base}services.html#web-development" role="menuitem">Web Development</a>
            <a href="${base}services.html#responsive-design" role="menuitem">Responsive Design</a>
            <a href="${base}services.html#seo-websites" role="menuitem">SEO-Friendly Websites</a>
            <a href="${base}services.html#conversion-optimization" role="menuitem">Conversion Optimization</a>
            <a href="${base}services.html#frontend-development" role="menuitem">Frontend Development</a>
            <a href="${base}services.html#ux-design" role="menuitem">UX-Focused Design</a>
          </div>
        </li>

        <li class="nav-dropdown">
          <a href="${base}blog/" id="nav-blog">
            Blog
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </a>
          <div class="nav-dropdown-menu" role="menu">
            <a href="${base}blog/" role="menuitem">All Articles</a>
            <a href="${base}category/web-development/" role="menuitem">Web Development</a>
            <a href="${base}category/seo/" role="menuitem">SEO</a>
            <a href="${base}category/conversion-optimization/" role="menuitem">Conversion Optimization</a>
            <a href="${base}category/ux-design/" role="menuitem">UX Design</a>
            <a href="${base}category/ai-web-development/" role="menuitem">AI &amp; Web Development</a>
            <a href="${base}category/local-business-growth/" role="menuitem">Local Business Growth</a>
            <a href="${base}category/beginner-guides/" role="menuitem">Beginner Guides</a>
          </div>
        </li>

        <li><a href="${base}case-studies/" id="nav-case-studies">Case Studies</a></li>
        <li><a href="${base}about.html" id="nav-about">About</a></li>
      </ul>

      <div class="nav-actions">
        <a href="${base}contact.html" class="btn btn-ghost btn-sm" id="nav-contact-link">Contact</a>
        <a href="${base}services.html" class="btn btn-primary btn-sm" id="nav-services-cta">Get Started</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <div class="nav-mobile-panel" id="nav-mobile-panel" aria-hidden="true">
      <a href="${base}index.html">Home</a>
      <a href="${base}services.html">Services</a>
      <a href="${base}blog/">Blog</a>
      <a href="${base}case-studies/">Case Studies</a>
      <a href="${base}about.html">About</a>
      <a href="${base}contact.html">Contact</a>
    </div>
  `;
  document.body.prepend(nav);

  // Scroll effect
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link highlight
  const path = location.pathname;
  nav.querySelectorAll('.nav-links > li > a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const hrefClean = href.replace(/\.\.\//g, '').replace('./', '');
    if (hrefClean && path.endsWith(hrefClean)) a.classList.add('active');
  });

  // Mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const panel  = document.getElementById('nav-mobile-panel');
  toggle?.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    panel.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  panel?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================================
   FOOTER
   ============================================================ */
function renderFooter() {
  const base = getBasePath();
  const year = new Date().getFullYear();
  const footer = document.createElement('footer');
  footer.id = 'footer';
  footer.setAttribute('role', 'contentinfo');
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="${base}index.html" class="nav-logo" aria-label="Automaze Studio">
            <div class="nav-logo-mark">A</div>
            <span class="nav-logo-name">Automaze<span> Studio</span></span>
          </a>
          <p>A premium web development agency crafting high-converting, SEO-optimized, and beautifully engineered digital experiences for modern businesses.</p>
          <div class="footer-social" aria-label="Social media links" style="margin-top: var(--space-5);">
            <a href="${SITE.linkedin}" class="social-icon" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" id="footer-linkedin">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="${SITE.instagram}" class="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer" id="footer-instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="${SITE.whatsapp}" class="social-icon" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" id="footer-whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Services</h4>
          <ul class="footer-links" role="list">
            <li><a href="${base}services.html#web-development">Web Development</a></li>
            <li><a href="${base}services.html#seo-websites">SEO Optimization</a></li>
            <li><a href="${base}services.html#ux-design">UX Design</a></li>
            <li><a href="${base}services.html#conversion-optimization">Conversion Optimization</a></li>
            <li><a href="${base}services.html#responsive-design">Responsive Design</a></li>
            <li><a href="${base}services.html#frontend-development">Frontend Development</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Content</h4>
          <ul class="footer-links" role="list">
            <li><a href="${base}blog/">All Articles</a></li>
            <li><a href="${base}category/web-development/">Web Development</a></li>
            <li><a href="${base}category/seo/">SEO</a></li>
            <li><a href="${base}category/conversion-optimization/">Conversion Optimization</a></li>
            <li><a href="${base}category/ai-web-development/">AI &amp; Web Development</a></li>
            <li><a href="${base}category/local-business-growth/">Local Business Growth</a></li>
            <li><a href="${base}category/beginner-guides/">Beginner Guides</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Company</h4>
          <ul class="footer-links" role="list">
            <li><a href="${base}about.html">About</a></li>
            <li><a href="${base}case-studies/">Case Studies</a></li>
            <li><a href="${base}contact.html">Contact</a></li>
            <li><a href="${base}privacy.html">Privacy Policy</a></li>
            <li><a href="${base}terms.html">Terms &amp; Conditions</a></li>
            <li><a href="${base}disclaimer.html">Disclaimer</a></li>
            <li><a href="${base}cookies.html">Cookies Policy</a></li>
            <li><a href="${base}sitemap.xml">Sitemap</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copy">
          &copy; ${year} <a href="${base}index.html">Automaze Studio</a>. All rights reserved.
          Content written from real project experience.
        </p>
        <div style="display:flex; gap:var(--space-4); align-items:center; flex-wrap:wrap;">
          <a href="${base}privacy.html" style="font-size:var(--text-xs);color:var(--color-text-muted);">Privacy</a>
          <a href="${base}terms.html" style="font-size:var(--text-xs);color:var(--color-text-muted);">Terms</a>
          <a href="${base}disclaimer.html" style="font-size:var(--text-xs);color:var(--color-text-muted);">Disclaimer</a>
          <a href="${base}cookies.html" style="font-size:var(--text-xs);color:var(--color-text-muted);">Cookies</a>
          <a href="${base}sitemap.xml" style="font-size:var(--text-xs);color:var(--color-text-muted);">Sitemap</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

/* ============================================================
   READING PROGRESS BAR
   ============================================================ */
function initReadingProgress() {
  const bar = document.createElement('div');
  bar.id = 'reading-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  document.body.prepend(bar);

  const article = document.querySelector('.article-body, main, article');
  if (!article) return;

  window.addEventListener('scroll', () => {
    const { top, height } = article.getBoundingClientRect();
    const scrolled = Math.max(0, Math.min(100,
      ((-top) / (height - window.innerHeight)) * 100
    ));
    bar.style.width = `${scrolled}%`;
  }, { passive: true });
}

/* ============================================================
   TOC ACTIVE HIGHLIGHT
   ============================================================ */
function initTOCHighlight() {
  const tocLinks = document.querySelectorAll('.toc-list a');
  if (!tocLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(a => a.classList.remove('active'));
        const active = [...tocLinks].find(a => a.getAttribute('href') === `#${entry.target.id}`);
        active?.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0% -70% 0%' });

  document.querySelectorAll('.article-body h2, .article-body h3').forEach(h => observer.observe(h));
}

/* ============================================================
   SCROLL REVEAL ANIMATIONS
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  initScrollReveal();
  if (document.querySelector('.article-body, [data-reading-progress]')) {
    initReadingProgress();
    initTOCHighlight();
  }
});
