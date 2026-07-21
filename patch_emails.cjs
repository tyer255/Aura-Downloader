const fs = require('fs');
let code = fs.readFileSync('src/pages/StaticPages.tsx', 'utf8');

code = code.replace(/support@aura-downloader\.com/g, 'mridulnareda56@gmail.com');
code = code.replace(/legal@aura-downloader\.com/g, 'mridulnareda56@gmail.com');

fs.writeFileSync('src/pages/StaticPages.tsx', code);
console.log("Patched emails successfully!");
