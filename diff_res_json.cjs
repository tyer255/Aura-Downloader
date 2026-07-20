const fs = require('fs');
const myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const regex = /const originalJson = res\.json\.bind\(res\);[\s\S]*?return this;\n    };/m;
const myMatch = myServer.match(regex)[0];
const repoMatch = repoServer.match(regex)[0];

console.log("res.json rewrite match:", myMatch === repoMatch);
