const fs   = require('fs');
const path = require('path');

function generateSitemap() {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  const indexPath = path.join(__dirname, 'content/blog/index.json');
  let posts = [];
  try {
    posts = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch(e) {
    console.error('Could not read index.json', e);
  }

  const BASE_URL = 'https://automazestudio.com';
  
  // Base URLs
  const staticUrls = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${BASE_URL}/services/`, priority: '0.9', changefreq: 'monthly' },
    { loc: `${BASE_URL}/about/`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/contact/`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/blog/`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/privacy/`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${BASE_URL}/terms/`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${BASE_URL}/disclaimer/`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${BASE_URL}/cookies/`, priority: '0.3', changefreq: 'yearly' }
  ];

  // Unique categories
  const categories = new Set(posts.map(p => p.categorySlug));
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static
  staticUrls.forEach(u => {
    xml += `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
  });

  // Add categories
  categories.forEach(c => {
    xml += `  <url>\n    <loc>${BASE_URL}/category/${c}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  // Add posts
  posts.forEach(p => {
    if (p.published === false) return;
    xml += `  <url>\n    <loc>${BASE_URL}/blog/${p.slug}/</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;

  fs.writeFileSync(sitemapPath, xml);
  console.log(`✓ sitemap.xml generated with ${posts.length} posts.`);
}

try {
  generateSitemap();
} catch(e) {
  console.error('Error generating sitemap:', e.message);
  process.exit(1);
}
