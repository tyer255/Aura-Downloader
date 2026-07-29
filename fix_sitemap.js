import fs from 'fs';

let sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');

const missingUrls = `
  <url>
    <loc>https://aura-download.ai.studio/spotify-downloader</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aura-download.ai.studio/threads-downloader</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aura-download.ai.studio/snapchat-downloader</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

sitemap = sitemap.replace('</urlset>', missingUrls);

fs.writeFileSync('public/sitemap.xml', sitemap);
console.log('Sitemap updated with new routes');
