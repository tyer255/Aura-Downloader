import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add canonical URL
app = app.replace(
    /<meta property="og:url" content=\{window\.location\.href\} \/>/,
    `<meta property="og:url" content={window.location.href} />\n        <link rel="canonical" href={\`https://aura-download.ai.studio/\${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}\`.replace(/\\/$/, '') || 'https://aura-download.ai.studio'} />`
);

// 2. Add advanced structured data (JSON-LD) inside Helmet
const schemaMarkup = `
        <script type="application/ld+json">
          {\`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "\${activeTabData.title}",
              "description": "\${activeTabData.description}",
              "url": "https://aura-download.ai.studio/\${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}",
              "publisher": {
                "@type": "Organization",
                "name": "Aura Downloader",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://aura-download.ai.studio/icon-512.png"
                }
              }
            }
          \`}
        </script>
        <script type="application/ld+json">
          {\`
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://aura-download.ai.studio/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "\${activeTabData.name}",
                  "item": "https://aura-download.ai.studio/\${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}"
                }
              ]
            }
          \`}
        </script>
        <script type="application/ld+json">
          {\`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "\${activeTabData.name}",
              "operatingSystem": "Any",
              "applicationCategory": "UtilitiesApplication",
              "description": "\${activeTabData.description}",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }
          \`}
        </script>
`;

app = app.replace(
    /<meta property="twitter:image" content=\{window\.location\.origin \+ "\/banner\.jpg"\} \/>/,
    `<meta property="twitter:image" content={window.location.origin + "/banner.jpg"} />${schemaMarkup}`
);

fs.writeFileSync('src/App.tsx', app);
console.log('App.tsx patched for SEO');
