/**
 * AUTOMAZE STUDIO — SEO ENGINE v2
 * Full meta, OG, Twitter, schema (Article/FAQ/Breadcrumb/Org/Website),
 * GEO signals for AI search engines, AEO optimization.
 */

const SEO = (() => {
  const BASE_URL  = 'https://automazestudio.com';
  let SITE_NAME   = 'Automaze Studio';
  let DESC        = 'Automaze Studio builds high-converting, SEO-optimized websites for modern businesses. Premium web development, editorial content, and UX-focused digital experiences.';
  let OG_IMAGE    = `${BASE_URL}/assets/images/og-image.jpg`;
  let LOGO        = `${BASE_URL}/assets/images/logo.svg`;
  const TWITTER   = '@automazestudio';
  const KEYWORDS  = 'web development agency, high-converting websites, SEO-friendly websites, responsive web development, UX design, frontend development, conversion rate optimization';

  let siteSettings = {
    siteTitle: 'Automaze Studio',
    siteDescription: 'Automaze Studio builds high-converting, SEO-optimized websites for modern businesses. Premium web development, editorial content, and UX-focused digital experiences.',
    defaultMetaTitle: 'Automaze Studio — Premium Web Development Agency',
    defaultMetaDescription: 'Automaze Studio builds high-converting, SEO-optimized websites for modern businesses. Premium web development, editorial content, and UX-focused digital experiences.',
    defaultOgImage: 'assets/images/og-image.jpg',
    googleAnalyticsId: '',
    googleSearchConsole: '',
    bingVerification: '',
    organizationSchema: ''
  };

  let lastApplied = null;

  function recordApplied(type, args = []) {
    lastApplied = { type, args };
  }

  async function loadSiteSettings() {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const isFile = parts.length > 0 && parts[parts.length - 1].includes('.');
      const depth = isFile ? parts.length - 1 : parts.length;
      const prefix = '../'.repeat(depth);
      
      const res = await fetch(prefix + 'content/site-settings.json');
      if (res.ok) {
        const data = await res.json();
        Object.assign(siteSettings, data);
        
        SITE_NAME = siteSettings.siteTitle || SITE_NAME;
        DESC = siteSettings.siteDescription || DESC;
        if (siteSettings.defaultOgImage) {
          OG_IMAGE = siteSettings.defaultOgImage.startsWith('http') ? siteSettings.defaultOgImage : `${BASE_URL}/${siteSettings.defaultOgImage}`;
        }
        
        // Re-apply if SEO was already called
        if (lastApplied) {
          if (lastApplied.type === 'home') applyHome(true);
          if (lastApplied.type === 'blog') applyBlog(...lastApplied.args, true);
          if (lastApplied.type === 'post') applyPost(...lastApplied.args, true);
          if (lastApplied.type === 'category') applyCategory(...lastApplied.args, true);
        }
        applyGlobalVerificationAndAnalytics();
      }
    } catch(e) {
      console.warn("Could not load dynamic SEO settings, using default placeholders.", e);
    }
  }

  function applyGlobalVerificationAndAnalytics() {
    if (siteSettings.googleSearchConsole) {
      setMeta('google-site-verification', siteSettings.googleSearchConsole);
    }
    if (siteSettings.bingVerification) {
      setMeta('msvalidate.01', siteSettings.bingVerification);
    }
    if (siteSettings.googleAnalyticsId) {
      const gaId = siteSettings.googleAnalyticsId;
      if (!document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(gaScript);

        const gaInitScript = document.createElement('script');
        gaInitScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(gaInitScript);
      }
    }
  }

  // Load immediately
  loadSiteSettings();

  /* -- helpers -- */
  function setMeta(name, content, attr = 'name') {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  function setCanonical(url) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
    el.href = url;
  }
  function injectSchema(data, id) {
    const elId = id || `schema-${(data['@type']||'custom').toLowerCase().replace(/\s/g,'-')}`;
    let el = document.getElementById(elId);
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = elId; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data);
  }
  function setTitle(t) { document.title = t; }

  /* -- schemas -- */
  function orgSchema() {
    if (siteSettings.organizationSchema) {
      try {
        return JSON.parse(siteSettings.organizationSchema);
      } catch(e) {
        console.warn("Failed parsing custom Organization Schema, using fallback.", e);
      }
    }
    return {
      '@context':'https://schema.org','@type':'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_NAME, url: BASE_URL,
      logo: { '@type':'ImageObject', url: LOGO },
      description: DESC,
      email: 'hello@automazestudio.com',
      sameAs: [
        'https://linkedin.com/in/automazestudio',
        'https://instagram.com/automazestudio',
      ],
      foundingDate: '2024',
      knowsAbout: ['Web Development','Technical SEO','UX Design','Conversion Rate Optimization','Frontend Development','Core Web Vitals'],
    };
  }
  function websiteSchema() {
    return {
      '@context':'https://schema.org','@type':'WebSite',
      '@id': `${BASE_URL}/#website`,
      name: SITE_NAME, url: BASE_URL, description: DESC,
      publisher: { '@id': `${BASE_URL}/#organization` },
      potentialAction: {
        '@type':'SearchAction',
        target: { '@type':'EntryPoint', urlTemplate:`${BASE_URL}/blog/?q={search_term_string}` },
        'query-input':'required name=search_term_string',
      },
    };
  }
  function personSchema() {
    return {
      '@context':'https://schema.org','@type':'Person',
      '@id': `${BASE_URL}/#author`,
      name: 'Muhammad Gulfam Ali',
      jobTitle: 'Lead Web Developer & SEO Architect',
      worksFor: { '@id': `${BASE_URL}/#organization` },
      url: `${BASE_URL}/about.html`,
      sameAs: [
        'https://www.linkedin.com/in/muhammad-gulfam-ali',
        'https://github.com/muhammadgulfamali'
      ],
      description: 'Lead Web Developer & SEO Architect at Automaze Studio, specializing in high-performance web development, technical SEO, and conversion optimization.'
    };
  }
  function breadcrumbSchema(crumbs) {
    return {
      '@context':'https://schema.org','@type':'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type':'ListItem', position: i + 1, name: c.name,
        item: c.url ? `${BASE_URL}${c.url}` : undefined,
      })),
    };
  }
  function faqSchema(faqs) {
    if (!faqs || !faqs.length) return null;
    return {
      '@context':'https://schema.org','@type':'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type':'Question', name: f.q,
        acceptedAnswer: { '@type':'Answer', text: f.a },
      })),
    };
  }
  function articleSchema(post) {
    return window.BlogEngine?.articleSchema?.(post, BASE_URL) || {};
  }

  /* -- OG / Twitter helpers -- */
  function applyOG({ type, title, desc, url, image }) {
    setMeta('og:type', type || 'website', 'property');
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:image', image || OG_IMAGE, 'property');
    setMeta('og:image:width', '1200', 'property');
    setMeta('og:image:height', '630', 'property');
    setMeta('og:image:alt', title, 'property');
    setMeta('og:locale', 'en_US', 'property');
  }
  function applyTwitter({ title, desc, image }) {
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', TWITTER);
    setMeta('twitter:creator', TWITTER);
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', image || OG_IMAGE);
  }
  function applyBase({ title, desc, keywords, url, robots }) {
    setTitle(title);
    setMeta('description', desc);
    setMeta('keywords', keywords || KEYWORDS);
    setMeta('robots', robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('author', SITE_NAME);
    setMeta('language', 'en');
    setMeta('content-language', 'en');
    setCanonical(url);
  }

  /* ======================================================
     HOME PAGE
  ====================================================== */
  function applyHome(skipRecord = false) {
    if (!skipRecord) recordApplied('home');
    const title = `${SITE_NAME} — Premium Web Development Agency`;
    const url   = `${BASE_URL}/`;
    applyBase({ title, desc: DESC, url });
    applyOG({ type:'website', title, desc: DESC, url });
    applyTwitter({ title, desc: DESC });
    injectSchema(orgSchema());
    injectSchema(websiteSchema());
    injectSchema({
      '@context':'https://schema.org','@type':'ProfessionalService',
      name: SITE_NAME, url: BASE_URL, image: OG_IMAGE,
      description: DESC, priceRange:'$$',
      serviceType:'Web Development',
      areaServed:{ '@type':'Country', name:'Worldwide' },
      hasOfferCatalog:{
        '@type':'OfferCatalog', name:'Web Development Services',
        itemListElement:[
          {itemOffered:{name:'High-Converting Website Development'}},
          {itemOffered:{name:'SEO-Friendly Website Design'}},
          {itemOffered:{name:'Responsive Web Development'}},
          {itemOffered:{name:'UX-Focused Web Experiences'}},
        ].map(o => ({'@type':'Offer',...o})),
      },
    }, 'schema-localservice');
  }

  /* ======================================================
     BLOG LISTING
  ====================================================== */
  function applyBlog({ page = 1, category = null } = {}, skipRecord = false) {
    if (!skipRecord) recordApplied('blog', [{ page, category }]);
    const title = category
      ? `${category} Articles — ${SITE_NAME}`
      : `Blog — Web Development, SEO & UX Insights | ${SITE_NAME}`;
    const desc = category
      ? `Expert articles on ${category} from Automaze Studio — practical guides for modern businesses.`
      : 'In-depth articles on web development, SEO, UX design, and conversion optimization. Written from real project experience.';
    const url = `${BASE_URL}/blog/${page > 1 ? `?page=${page}` : ''}`;
    
    const urlParams = new URLSearchParams(location.search);
    const hasSearch = urlParams.has('q') || urlParams.has('s');
    const robots = (page > 1 || hasSearch) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
    
    applyBase({ title, desc, url, robots });
    applyOG({ type:'website', title, desc, url });
    applyTwitter({ title, desc });
    injectSchema(orgSchema());
    injectSchema(websiteSchema());
  }

  /* ======================================================
     BLOG POST
  ====================================================== */
  function applyPost(post, skipRecord = false) {
    if (!skipRecord) recordApplied('post', [post]);
    const url   = `${BASE_URL}/blog/${post.slug}/`;
    const title = `${post.title} | ${SITE_NAME}`;
    const desc  = post.excerpt;

    applyBase({ title, desc, url,
      keywords: `${post.category}, ${post.title.split(' ').slice(0,5).join(', ')}, web development, automaze studio`,
    });

    let preloadEl = document.querySelector('link[rel="preload"][as="image"]');
    if (!preloadEl) {
      preloadEl = document.createElement('link');
      preloadEl.rel = 'preload';
      preloadEl.as = 'image';
      preloadEl.href = `${BASE_URL}/assets/images/thumbnails/${post.slug}.webp`;
      preloadEl.setAttribute('fetchpriority', 'high');
      document.head.appendChild(preloadEl);
    }

    setMeta('article:published_time', post.date, 'property');
    setMeta('article:modified_time', post.date, 'property');
    setMeta('article:section', post.category, 'property');
    setMeta('article:author', 'Muhammad Gulfam Ali', 'property');
    setMeta('article:tag', post.category, 'property');

    applyOG({ type:'article', title, desc, url });
    applyTwitter({ title, desc });

    injectSchema(articleSchema(post), 'schema-article');
    injectSchema(orgSchema(), 'schema-organization');
    injectSchema(personSchema(), 'schema-person');
    injectSchema(breadcrumbSchema([
      { name:'Home', url:'/' },
      { name:'Blog', url:'/blog/' },
      { name: post.category, url:`/category/${post.categorySlug}/` },
      { name: post.title },
    ]), 'schema-breadcrumb');

    if (post.faqs && post.faqs.length) {
      const fs = faqSchema(post.faqs);
      if (fs) injectSchema(fs, 'schema-faq');
    }

    injectSchema({
      '@context':'https://schema.org',
      '@type':'WebPage',
      name: title,
      url,
      speakable: {
        '@type':'SpeakableSpecification',
        cssSelector: ['.quick-answer', '.article-body h2:first-of-type', '.article-body p:first-of-type'],
      },
    }, 'schema-webpage');
  }

  /* ======================================================
     CATEGORY PAGE
  ====================================================== */
  function applyCategory(category, slug, skipRecord = false) {
    if (!skipRecord) recordApplied('category', [category, slug]);
    const title = `${category} — ${SITE_NAME} Blog`;
    const desc  = `Expert articles on ${category} from Automaze Studio. Practical guides, tutorials, and insights for modern web professionals.`;
    const url   = `${BASE_URL}/category/${slug}/`;
    applyBase({ title, desc, url });
    applyOG({ type:'website', title, desc, url });
    applyTwitter({ title, desc });
    injectSchema(orgSchema());
    injectSchema(breadcrumbSchema([
      { name:'Home', url:'/' }, { name:'Blog', url:'/blog/' }, { name: category },
    ]));
  }

  return {
    applyHome, applyBlog, applyPost, applyCategory,
    injectSchema, setMeta, setCanonical,
    orgSchema, websiteSchema, breadcrumbSchema, faqSchema, articleSchema,
    BASE_URL, SITE_NAME,
  };
})();

window.SEO = SEO;
