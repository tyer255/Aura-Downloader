const fs = require('fs');

const myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const myPin = myServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];
const repoPin = repoServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];

console.log("MY PIN:");
console.log(myPin);
console.log("\nREPO PIN:");
console.log(repoPin);
