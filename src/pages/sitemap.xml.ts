import type { APIRoute } from 'astro';
import releasesData from '../../phantom-grid-os/data/releases.json';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? 'https://phantom-grid.de').toString().replace(/\/$/, '');

  const staticUrls = ['', '/releases'].map(
    (path) => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`
  );

  const releaseUrls = releasesData.releases.map(
    (r) => `
  <url>
    <loc>${base}/releases/${r.catalog.toLowerCase()}</loc>
    <lastmod>${r.release_date ? r.release_date.slice(0, 10) : new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...releaseUrls].join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
