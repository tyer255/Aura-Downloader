import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  "const res = await fetch(`https://www.instagram.com/p/${sc}/embed/captioned/`, {",
  "const res = await fetch(`https://www.instagram.com/p/${sc}/embed/captioned/`, {\n      signal: AbortSignal.timeout(5000),"
);
fs.writeFileSync('server.ts', content);
