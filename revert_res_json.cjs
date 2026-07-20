const fs = require('fs');

let myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const regex = /app\.post\("\/api\/download", async \(req, res\) => \{[\s\S]*?return this;\n    \};/m;
const myMatch = myServer.match(regex)[0];
const repoMatch = repoServer.match(regex)[0];

myServer = myServer.replace(myMatch, repoMatch);

fs.writeFileSync('server.ts', myServer);
console.log("Reverted res.json logic.");
