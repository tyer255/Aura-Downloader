const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove vreden extraction from /api/download
code = code.replace(/\/\/ 1\. Primary for YouTube: @vreden\/youtube_scraper[\s\S]*?if \(vredenResult && vredenResult\.success\) \{\s*console\.log\("Extraction via @vreden\/youtube_scraper succeeded!"\);\s*return res\.json\(vredenResult\);\s*\}\s*\}/, '');

fs.writeFileSync('server.ts', code);
