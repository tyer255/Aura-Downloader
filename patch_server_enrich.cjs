const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(url.includes\('m3u8'\)\) return "Unknown Size";/g,
  `if (url.includes('m3u8')) return null;`
).replace(
  /return "Unknown Size";/g,
  `return null;`
).replace(
  /const formatted = size \? formatBytes\(size\) : "Unknown Size";/g,
  `const formatted = size ? formatBytes(size) : null;`
);

fs.writeFileSync('server.ts', code);
console.log("Updated enrichResultSizes in server.ts");
