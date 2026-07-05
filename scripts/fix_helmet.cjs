const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove the incorrect Helmet injection
const incorrectHelmetRegex = /\s*<Helmet>\s*<title>\{activeTabData\.name\} \| Social Downloader<\/title>[\s\S]*?<\/Helmet>/;
content = content.replace(incorrectHelmetRegex, '');

// Find where DownloaderView starts and insert it at the beginning of its return
content = content.replace(/(return\s*\(\s*)<div className=\{clsx\(\s*"min-h-screen/m, '$1<>\n      <Helmet>\n        <title>{activeTabData.name} | Social Downloader</title>\n        <meta name="description" content={activeTabData.description} />\n        <meta property="og:title" content={`\\${activeTabData.name} | Social Downloader`} />\n        <meta property="og:description" content={activeTabData.description} />\n        <meta property="og:type" content="website" />\n        <meta name="twitter:card" content="summary_large_image" />\n      </Helmet>\n      <div className={clsx(\n        "min-h-screen');
// Need to add closing fragment since we opened one.
// Let's check where the return of DownloaderView ends.
