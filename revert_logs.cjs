const fs = require('fs');

let myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const regex = /console\.log\("--> API START: ", trimmedUrl\);\n      console\.log\(`Processing extraction for platform: \$\{platform\}, type: \$\{type\}, url: \$\{trimmedUrl\}`\);/m;
const repoMatch = 'console.log(`Processing extraction for platform: ${platform}, type: ${type}, url: ${trimmedUrl}`);';

myServer = myServer.replace(regex, repoMatch);

fs.writeFileSync('server.ts', myServer);
console.log("Reverted router logs.");
