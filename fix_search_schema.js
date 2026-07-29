import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const websiteSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Aura Downloader",
      "url": "https://aura-download.ai.studio/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://aura-download.ai.studio/?url={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
`;

html = html.replace('</head>', websiteSchema + '</head>');
fs.writeFileSync('index.html', html);
console.log('SearchAction Schema added');
