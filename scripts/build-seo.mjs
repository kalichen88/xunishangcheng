import fs from 'node:fs';
import path from 'node:path';

const catalog = JSON.parse(
  fs.readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
);

const base = (process.env.SITE_URL ?? 'https://tidesmm.kalichen80.workers.dev').replace(/\/+$/, '');
const pages = ['/', '/services', '/faq', '/terms', '/privacy'];
const urls = [
  ...pages.map((page) => ({ loc: `${base}${page === '/' ? '/' : page}`, priority: page === '/' ? '1.0' : '0.6' })),
  ...catalog.services.map((service) => ({
    loc: `${base}/service/${service.id}`,
    priority: '0.5',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>2026-10-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /checkout
Disallow: /orders
Disallow: /order/
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;

const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
console.log(`seo: ${urls.length} urls for ${base}`);
