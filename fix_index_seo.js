import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/aura-downloader-yg40\.onrender\.com/g, 'aura-download.ai.studio');

// Add preconnects for speed
const preconnects = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="dns-prefetch" href="https://aura-download.ai.studio" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
`;

html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', preconnects);

fs.writeFileSync('index.html', html);
console.log('index.html fixed');
