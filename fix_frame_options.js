import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/res\.setHeader\("X-Frame-Options", "SAMEORIGIN"\);\n\s*/, '');
fs.writeFileSync('server.ts', server);
console.log('Removed X-Frame-Options');
