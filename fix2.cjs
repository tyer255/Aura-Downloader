const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find the line that is causing the issue:
code = code.replace(/if \(!directUrl && !isProfile\) \{\s*const mediaType =/g, 'const mediaType =');

fs.writeFileSync('server.ts', code);
