/**
 * AUTOMAZE STUDIO — BLOG ENGINE v2
 * Full-featured: parsing, TOC, FAQ detection, internal linking,
 * Quick Answer blocks, content rendering, schema, GEO/AEO optimization.
 */

const BlogEngine = (() => {

  /* ======================================================
     SLUG / UTILITIES
  ====================================================== */
  function toSlug(str) {
    return str.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function readingTime(text) {
    const words = text.trim().split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 220))} min read`;
  }

  function makeExcerpt(text, len = 200) {
    const clean = text.replace(/\[|\]/g, '').replace(/\r?\n/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len).trim() + '…' : clean;
  }

  /* ======================================================
     THUMBNAIL COLOR PALETTE (deterministic per category)
  ====================================================== */
  const CATEGORY_COLORS = {
    'web-development':        { accent: '#5B6FFF', glow: 'rgba(91,111,255,0.3)',  emoji: '⚡' },
    'seo':                    { accent: '#00D4AA', glow: 'rgba(0,212,170,0.3)',   emoji: '🔍' },
    'conversion-optimization':{ accent: '#F59E0B', glow: 'rgba(245,158,11,0.3)', emoji: '🎯' },
    'ux-design':              { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.3)', emoji: '✨' },
    'ai-web-development':     { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.3)', emoji: '🤖' },
    'local-business-growth':  { accent: '#00D4AA', glow: 'rgba(0,212,170,0.3)',   emoji: '📈' },
    'beginner-guides':        { accent: '#EF4444', glow: 'rgba(239,68,68,0.3)',   emoji: '🌱' },
    'general':                { accent: '#5B6FFF', glow: 'rgba(91,111,255,0.3)', emoji: '📝' },
  };
  function getCatColor(slug) {
    return CATEGORY_COLORS[slug] || CATEGORY_COLORS['general'];
  }

  /* ======================================================
     DETERMINISTIC DATE
  ====================================================== */
  function generateDate(i) {
    const base = new Date('2025-01-10');
    base.setDate(base.getDate() + i * 7);
    return base.toISOString().split('T')[0];
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }

  /* ======================================================
     TABLE OF CONTENTS — improved detection
  ====================================================== */
  function buildTOC(content) {
    const headings = [];
    const seen = new Set();
    const lines = content.split(/\r?\n/);

    lines.forEach(line => {
      const l = line.trim();
      if (!l || l.length < 8 || l.length > 110) return;
      if (l.endsWith('.') || l.endsWith(',') || l.endsWith(';')) return;
      if (l.includes('http') || l.startsWith('-') || /^\d+[.,]/.test(l)) return;

      const wordCount = l.split(/\s+/).length;
      const isH2 = wordCount >= 3 && wordCount <= 12 &&
        /^(The |Why |How |What |Step |Understanding |Real |Common |Final |Phase |Building |Creating |Optimizing |A Guide|Key |Top |Best |When |Making |Getting |Using |Choosing |Avoiding |Improving |Measuring )/i.test(l);
      const isH3 = /^\d+\.\s/.test(l) && wordCount <= 10;

      if ((isH2 || isH3) && !seen.has(l)) {
        seen.add(l);
        headings.push({
          level: isH3 ? 3 : 2,
          text: l.replace(/^\d+\.\s/, '').replace(/[:#]/g, '').trim(),
          id: toSlug(l)
        });
      }
    });

    return headings.slice(0, 10);
  }

  /* ======================================================
     FAQ EXTRACTION — detects Q&A patterns in content
  ====================================================== */
  function extractFAQs(content) {
    const faqs = [];
    const lines = content.split(/\r?\n/);

    // Pattern: Question ending with '?' followed by an answer paragraph
    for (let i = 0; i < lines.length - 1; i++) {
      const l = lines[i].trim();
      if (l.endsWith('?') && l.length > 15 && l.length < 150) {
        // Collect the answer: next non-empty lines until blank line or next question
        let answer = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const next = lines[j].trim();
          if (!next) break;
          if (next.endsWith('?')) break;
          answer += (answer ? ' ' : '') + next;
          if (answer.length > 40) break;
        }
        if (answer.length > 20) {
          faqs.push({ q: l, a: answer });
        }
      }
    }
    return faqs.slice(0, 5);
  }

  /* ======================================================
     QUICK ANSWER EXTRACTION — first substantive paragraph
  ====================================================== */
  function extractQuickAnswer(content) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const l = line.trim();
      // Must be a substantial prose sentence
      if (l.length > 80 && l.length < 400 && l.endsWith('.') &&
          !l.startsWith('-') && !/^\d+\./.test(l) &&
          l.split(' ').length > 15) {
        return l;
      }
    }
    return null;
  }

  /* ======================================================
     INTERNAL LINK DETECTION — keyword-based
  ====================================================== */
  const INTERNAL_LINK_MAP = {
    'conversion rate': 'conversion-optimization',
    'conversion optimization': 'conversion-optimization',
    'seo': 'seo',
    'search engine optimization': 'seo',
    'core web vitals': 'seo',
    'ux design': 'ux-design',
    'user experience': 'ux-design',
    'web development': 'web-development',
    'responsive design': 'web-development',
    'page speed': 'seo',
    'pagespeed': 'seo',
  };

  function injectInternalLinks(html, currentCategorySlug, basePath = '../') {
    let result = html;
    let linkCount = 0;
    const used = new Set();

    Object.entries(INTERNAL_LINK_MAP).forEach(([keyword, catSlug]) => {
      if (linkCount >= 4) return;
      if (catSlug === currentCategorySlug) return;
      if (used.has(catSlug)) return;

      const regex = new RegExp(`(?<![">])(${keyword})(?!</a>)`, 'i');
      if (regex.test(result)) {
        result = result.replace(regex, (match) => {
          used.add(catSlug);
          linkCount++;
          return `<a href="${basePath}category/${catSlug}/" class="article-inline-link">${match}</a>`;
        });
      }
    });

    return result;
  }

  /* ======================================================
     CONTENT RENDERER — premium markdown-like parser
  ====================================================== */
  function renderContent(raw, options = {}) {
    const { basePath = '../', categorySlug = 'general' } = options;
    const lines = raw.split(/\r?\n/);
    let html = '';
    let inList = false;
    let inNumberedList = false;
    let paraBuffer = [];

    function flushPara() {
      if (!paraBuffer.length) return;
      const text = paraBuffer.join(' ').trim();
      if (text) html += `<p>${escapeHTML(text)}</p>\n`;
      paraBuffer = [];
    }

    function escapeHTML(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
    }

    lines.forEach((line, i) => {
      const l = line.trim();

      // Empty line — flush buffer
      if (!l) {
        flushPara();
        if (inList)         { html += '</ul>\n'; inList = false; }
        if (inNumberedList) { html += '</ol>\n'; inNumberedList = false; }
        return;
      }

      // Numbered item acting as h3
      if (/^\d+\.\s/.test(l) && l.split(' ').length <= 10) {
        flushPara();
        if (inList)         { html += '</ul>\n'; inList = false; }
        if (inNumberedList) { html += '</ol>\n'; inNumberedList = false; }
        const cleaned = l.replace(/^\d+\.\s/, '').replace(/[:#]/g, '').trim();
        html += `<h3 id="${toSlug(l)}">${escapeHTML(cleaned)}</h3>\n`;
        return;
      }

      // Heading detection
      const wordCount = l.split(/\s+/).length;
      const isHeading = wordCount >= 3 && wordCount <= 12 &&
        !l.endsWith('.') && !l.endsWith(',') && !l.endsWith(';') &&
        !l.startsWith('-') && !l.includes('http') &&
        /^(The |Why |How |What |Step |Understanding |Real |Common |Final |Phase |Building |Creating |Optimizing |A Guide|Key |Top |Best |When |Making |Getting |Using |Choosing |Avoiding |Improving |Measuring )/i.test(l);

      if (isHeading) {
        flushPara();
        if (inList)         { html += '</ul>\n'; inList = false; }
        if (inNumberedList) { html += '</ol>\n'; inNumberedList = false; }
        html += `<h2 id="${toSlug(l)}">${escapeHTML(l)}</h2>\n`;
        return;
      }

      // Bullet point
      if (l.startsWith('- ') || l.startsWith('• ')) {
        flushPara();
        if (inNumberedList) { html += '</ol>\n'; inNumberedList = false; }
        if (!inList) { html += '<ul>\n'; inList = true; }
        html += `<li>${escapeHTML(l.replace(/^[-•]\s/, ''))}</li>\n`;
        return;
      }

      // Short phrase likely a bullet (≤8 words, no period, previous context suggests list)
      if (wordCount <= 6 && !l.endsWith('.') && !l.endsWith('?') && i > 0) {
        const prev = lines[i-1].trim();
        if (prev === '' || /^[-•]/.test(prev) || /^\d+\./.test(prev)) {
          flushPara();
          if (!inList) { html += '<ul>\n'; inList = true; }
          html += `<li>${escapeHTML(l)}</li>\n`;
          return;
        }
      }

      // Regular paragraph text — buffer it
      if (inList)         { html += '</ul>\n'; inList = false; }
      if (inNumberedList) { html += '</ol>\n'; inNumberedList = false; }
      paraBuffer.push(l);
    });

    flushPara();
    if (inList) html += '</ul>\n';
    if (inNumberedList) html += '</ol>\n';

    // Inject internal links
    html = injectInternalLinks(html, categorySlug, basePath);
    return html;
  }

  /* ======================================================
     PARSE BLOG FILE (now fetches index.json)
  ====================================================== */
  async function parseBlogFile(url = '../content/blog/index.json') {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.filter(p => p.published !== false);
    } catch(e) {
      console.error('BlogEngine: Could not load blogs from ' + url, e);
      return [];
    }
  }

  const SEMANTIC_TAGS = [
    { name: 'SEO', keywords: ['seo', 'search engine', 'google rank', 'keywords', 'optimization', 'crawled'] },
    { name: 'CRO', keywords: ['conversion rate', 'cro', 'friction', 'cta', 'conversion optimization', 'purchase', 'leads'] },
    { name: 'Landing Pages', keywords: ['landing page', 'funnel', 'signup', 'homepage'] },
    { name: 'Responsive Design', keywords: ['responsive', 'mobile-first', 'viewport', 'mobile users', 'phone'] },
    { name: 'Local SEO', keywords: ['local seo', 'small business', 'local business', 'bakery', 'gym', 'repair'] },
    { name: 'Web Performance', keywords: ['speed', 'caching', 'lcp', 'cls', 'performance', 'pagespeed', 'load time', 'seconds'] },
    { name: 'AI Tools', keywords: ['ai', 'llm', 'gpt', 'intelligent', 'chatbot', 'artificial intelligence'] },
    { name: 'Frontend Development', keywords: ['frontend', 'react', 'node', 'javascript', 'html', 'css', 'git', 'coding', 'developer'] },
    { name: 'UX Design', keywords: ['ux design', 'user experience', 'hierarchy', 'typography', 'friction', 'fonts'] }
  ];

  function extractTags(content, category) {
    const tags = [];
    const text = content.toLowerCase();
    
    SEMANTIC_TAGS.forEach(t => {
      const matchesKeyword = t.keywords.some(k => text.includes(k));
      if (matchesKeyword || category.toLowerCase().includes(t.name.toLowerCase())) {
        tags.push(t.name);
      }
    });
    
    if (tags.length === 0) {
      tags.push(category);
    }
    
    return [...new Set(tags)].slice(0, 4);
  }

  function parseRaw(raw) {
    const blocks = raw.split(/\r?\nTITLE:\r?\n/).filter(b => b.trim());
    const posts = [];
    let index = 0;

    blocks.forEach(block => {
      try {
        const catMatch    = block.match(/CATEGORY:\r?\n([^\r\n]+)/);
        const category    = catMatch ? catMatch[1].trim() : 'General';
        const titleLine   = block.split(/\r?\n/)[0].trim();
        const title       = titleLine || 'Untitled';
        const contentMatch = block.match(/BLOG CONTENT:\r?\n\[([^]*?)\]/);
        const content     = contentMatch ? contentMatch[1].trim() : '';
        if (!content || !title) return;

        const slug        = toSlug(title);
        const categorySlug= toSlug(category);
        const col         = getCatColor(categorySlug);
        const date        = generateDate(index);
        const wordCount   = content.split(/\s+/).length;
        const faqs        = extractFAQs(content);
        const quickAnswer = extractQuickAnswer(content);
        const toc         = buildTOC(content);
        const tags        = extractTags(content, category);

        posts.push({
          id: index, title, slug, category, categorySlug,
          content, excerpt: makeExcerpt(content),
          readTime: readingTime(content), toc, date,
          wordCount, faqs, quickAnswer, tags,
          accentColor: col.accent, glowColor: col.glow, emoji: col.emoji,
          featured: index === 0,
        });
        index++;
      } catch(e) {
        console.warn('BlogEngine: skipped malformed block', e);
      }
    });

    return posts;
  }

  /* ======================================================
     RELATED POSTS
  ====================================================== */
  function getRelated(posts, current, limit = 3) {
    return posts
      .filter(p => p.id !== current.id)
      .map(p => ({
        post: p,
        score: (p.categorySlug === current.categorySlug ? 4 : 0) +
               sharedWords(p.title, current.title) +
               sharedWords(p.excerpt, current.excerpt) * 0.5
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.post);
  }

  function sharedWords(a, b) {
    const stopWords = new Set(['the','and','for','are','was','with','this','that','from','have','not','but','you','your','can','will','how','why','what','when']);
    const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w)));
    return b.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w) && setA.has(w)).length;
  }

  /* ======================================================
     CATEGORIES
  ====================================================== */
  function getCategories(posts) {
    const map = {};
    posts.forEach(p => {
      if (!map[p.categorySlug]) map[p.categorySlug] = { name: p.category, slug: p.categorySlug, count: 0 };
      map[p.categorySlug].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }

  /* ======================================================
     SEARCH
  ====================================================== */
  function search(posts, query) {
    const q = query.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    ).sort((a, b) => {
      // Boost title matches
      const aTitle = a.title.toLowerCase().includes(q) ? 2 : 0;
      const bTitle = b.title.toLowerCase().includes(q) ? 2 : 0;
      return (bTitle) - (aTitle);
    });
  }

  /* ======================================================
     ARTICLE SCHEMA
  ====================================================== */
  function articleSchema(post, baseUrl = 'https://automazestudio.com') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${baseUrl}/blog/${post.slug}/#article`,
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Person',
        '@id': `${baseUrl}/#author`,
        name: 'Muhammad Gulfam Ali',
        url: `${baseUrl}/about.html`,
        sameAs: [
          'https://www.linkedin.com/in/muhammad-gulfam-ali',
          'https://github.com/muhammadgulfamali'
        ]
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Automaze Studio',
        url: baseUrl,
        logo: { '@type': 'ImageObject', url: `${baseUrl}/assets/images/logo.svg` }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${baseUrl}/blog/${post.slug}/` },
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`
      },
      articleSection: post.category,
      wordCount: post.wordCount,
      keywords: `${post.category}, web development, ${post.title.split(' ').slice(0,5).join(', ')}`,
      image: { '@type': 'ImageObject', url: `${baseUrl}/assets/images/og-image.jpg`, width: 1200, height: 630 },
    };
    return schema;
  }

  /* ======================================================
     PUBLIC API
  ====================================================== */
  return {
    parseBlogFile, parseRaw, toSlug, formatDate,
    getRelated, getCategories, search,
    renderContent, articleSchema,
    readingTime, makeExcerpt, buildTOC,
    extractFAQs, extractQuickAnswer, getCatColor,
  };
})();

window.BlogEngine = BlogEngine;
