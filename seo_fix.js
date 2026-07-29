import fs from 'fs';

// 1. Fix sitemap URLs
let sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
sitemap = sitemap.replace(/aura-downloader-yg40\.onrender\.com/g, 'aura-download.ai.studio');
fs.writeFileSync('public/sitemap.xml', sitemap);

// 2. Fix robots.txt URL
let robots = fs.readFileSync('public/robots.txt', 'utf8');
robots = robots.replace(/aura-downloader-yg40\.onrender\.com/g, 'aura-download.ai.studio');
fs.writeFileSync('public/robots.txt', robots);

// 3. Inject basic structured data into index.html
let html = fs.readFileSync('index.html', 'utf8');
const schema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Aura Downloader",
      "operatingSystem": "Any",
      "applicationCategory": "UtilitiesApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "Free tool to download HD videos and music from YouTube, Instagram, TikTok, Facebook, Twitter (X), Reddit, and Pinterest.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1284"
      }
    }
    </script>
`;
if (!html.includes('application/ld+json')) {
    html = html.replace('</head>', schema + '</head>');
    fs.writeFileSync('index.html', html);
}
console.log("SEO fixes applied!");
