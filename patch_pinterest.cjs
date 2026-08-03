const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'console.log("btch-downloader pinterest error:", e);',
  '// silently ignore btch-downloader errors'
);

fs.writeFileSync('server.ts', content);
