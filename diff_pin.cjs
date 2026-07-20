const fs = require('fs');
const myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const myNative = myServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];
const repoNative = repoServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];
console.log("Native match:", myNative === repoNative);

const myBtch = myServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];
const repoBtch = repoServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];
console.log("Btch match:", myBtch === repoBtch);

const routeMatchRegex = /if\s*\(platform\s*===\s*'pinterest'\)\s*\{[\s\S]*?console\.log\("Trying Cobalt API\.\.\."\);/m;
const myRoute = myServer.match(routeMatchRegex)[0];
const repoRoute = repoServer.match(routeMatchRegex)[0];
console.log("Route match:", myRoute === repoRoute);
