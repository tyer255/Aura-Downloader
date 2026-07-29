import fs from 'fs';

let server = fs.readFileSync('server.ts', 'utf8');

const sitemapCode = `
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: https://aura-download.ai.studio/sitemap.xml");
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const sitemap = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aura-download.ai.studio/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://aura-download.ai.studio/youtube-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/instagram-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/tiktok-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/facebook-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/pinterest-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/x-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/reddit-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://aura-download.ai.studio/linkedin-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://aura-download.ai.studio/spotify-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/threads-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/snapchat-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-download.ai.studio/faq</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://aura-download.ai.studio/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://aura-download.ai.studio/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://aura-download.ai.studio/privacy-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-download.ai.studio/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-download.ai.studio/dmca</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-download.ai.studio/cookie-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>\`;
    res.send(sitemap);
  });

  if (process.env.NODE_ENV !== "production") {`;

server = server.replace('  if (process.env.NODE_ENV !== "production") {', sitemapCode);

fs.writeFileSync('server.ts', server);
console.log('Injected sitemap and robots routes');
