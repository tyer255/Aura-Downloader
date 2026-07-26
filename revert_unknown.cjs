const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(url.includes\('m3u8'\)\) return null;/g,
  `if (url.includes('m3u8')) return "Unknown Size";`
).replace(
  /\} else if \(url.startsWith\('\/api\/'\)\) \{\n        return null;\n    \}/g,
  `} else if (url.startsWith('/api/')) {\n        return "Unknown Size";\n    }`
).replace(
  /\} catch\(e\) \{\n        return null;\n    \}/g,
  `} catch(e) {\n        return "Unknown Size";\n    }`
).replace(
  /const formatted = size \? formatBytes\(size\) : null;/g,
  `const formatted = size ? formatBytes(size) : "Unknown Size";`
);

fs.writeFileSync('server.ts', code);
console.log("Reverted Unknown Size logic in server.ts");
