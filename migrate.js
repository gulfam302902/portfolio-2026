const fs = require('fs');
const path = require('path');

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

function generateDate(i) {
  const base = new Date('2025-01-10');
  base.setDate(base.getDate() + i * 7);
  return base.toISOString().split('T')[0];
}

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
      headings.push({ level: isH3 ? 3 : 2, text: l.replace(/^\d+\.\s/, '').replace(/[:#]/g, '').trim(), id: toSlug(l) });
    }
  });
  return headings.slice(0, 10);
}

function extractFAQs(content) {
  const faqs = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    const l = lines[i].trim();
    if (l.endsWith('?') && l.length > 15 && l.length < 150) {
      let answer = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) break;
        if (next.endsWith('?')) break;
        answer += (answer ? ' ' : '') + next;
        if (answer.length > 40) break;
      }
      if (answer.length > 20) faqs.push({ q: l, a: answer });
    }
  }
  return faqs.slice(0, 5);
}

function extractQuickAnswer(content) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const l = line.trim();
    if (l.length > 80 && l.length < 400 && l.endsWith('.') && !l.startsWith('-') && !/^\d+\./.test(l) && l.split(' ').length > 15) return l;
  }
  return null;
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
    if (t.keywords.some(k => text.includes(k)) || category.toLowerCase().includes(t.name.toLowerCase())) tags.push(t.name);
  });
  if (tags.length === 0) tags.push(category);
  return [...new Set(tags)].slice(0, 4);
}

function runMigration() {
  const raw = fs.readFileSync('All Blogs.txt', 'utf8');
  const blocks = raw.split(/\r?\nTITLE:\r?\n/).filter(b => b.trim());
  const posts = [];
  const indexArray = [];
  
  if (!fs.existsSync('content')) fs.mkdirSync('content');
  if (!fs.existsSync('content/blog')) fs.mkdirSync('content/blog');

  let index = 0;
  blocks.forEach(block => {
    try {
      const catMatch = block.match(/CATEGORY:\r?\n([^\r\n]+)/);
      const category = catMatch ? catMatch[1].trim() : 'General';
      const titleLine = block.split(/\r?\n/)[0].trim();
      const title = titleLine || 'Untitled';
      const contentMatch = block.match(/BLOG CONTENT:\r?\n\[([^]*?)\]/);
      const content = contentMatch ? contentMatch[1].trim() : '';
      if (!content || !title) return;

      const slug = toSlug(title);
      const categorySlug = toSlug(category);
      const col = getCatColor(categorySlug);
      const date = generateDate(index);
      const wordCount = content.split(/\s+/).length;
      const faqs = extractFAQs(content);
      const quickAnswer = extractQuickAnswer(content);
      const toc = buildTOC(content);
      const tags = extractTags(content, category);
      
      const postObj = {
        id: index, title, slug, category, categorySlug,
        content, excerpt: makeExcerpt(content),
        readTime: readingTime(content), toc, date,
        wordCount, faqs, quickAnswer, tags,
        accentColor: col.accent, glowColor: col.glow, emoji: col.emoji,
        featured: index === 0,
        published: true // for the CMS state
      };
      
      const indexObj = {
        id: index, title: postObj.title, slug: postObj.slug, 
        category: postObj.category, categorySlug: postObj.categorySlug,
        excerpt: postObj.excerpt, readTime: postObj.readTime, 
        date: postObj.date, wordCount: postObj.wordCount,
        emoji: postObj.emoji, featured: postObj.featured, published: true
      };

      fs.writeFileSync(`content/blog/${slug}.json`, JSON.stringify(postObj, null, 2));
      indexArray.push(indexObj);
      index++;
    } catch(e) {
      console.error(e);
    }
  });

  fs.writeFileSync('content/blog/index.json', JSON.stringify(indexArray, null, 2));
  console.log(`Migrated ${indexArray.length} posts to content/blog/`);
}

runMigration();
