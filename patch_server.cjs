const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'if (items.length === 0) throw new Error("Empty media returned");',
  'if (items.length === 0) { console.log("btch-downloader returned empty media."); return null; }'
);

content = content.replace(
  'console.log("btch-downloader error:", e);',
  '// silently ignore btch-downloader errors to avoid log noise'
);

fs.writeFileSync('server.ts', content);
