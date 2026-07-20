const fs = require('fs');

const myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const myPin = myServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];
const repoPin = repoServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];

console.log("MY PIN BTCH:");
console.log(myPin);
console.log("\nREPO PIN BTCH:");
console.log(repoPin);
