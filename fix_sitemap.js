import fs from 'fs';

const domain = "https://aura-downloader-yg40.onrender.com";

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/youtube-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/instagram-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/tiktok-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/facebook-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/pinterest-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/x-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/reddit-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/linkedin-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/spotify-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/threads-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/snapchat-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${domain}/faq</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${domain}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${domain}/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${domain}/privacy-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/dmca</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/cookie-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>
`.trim();

fs.writeFileSync('public/sitemap.xml', sitemapXml);

let server = fs.readFileSync('server.ts', 'utf8');

const sitemapCode = `
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: https://aura-downloader-yg40.onrender.com/sitemap.xml");
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(\`${sitemapXml}\`);
  });

  if (process.env.NODE_ENV !== "production") {`;

// We'll replace the existing block
server = server.replace(/app\.get\("\/robots\.txt"[\s\S]*?if\s*\(process\.env\.NODE_ENV !== "production"\)\s*\{/, sitemapCode);

fs.writeFileSync('server.ts', server);

console.log('Fixed sitemap generation');
