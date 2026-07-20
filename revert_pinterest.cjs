const fs = require('fs');

const myServer = fs.readFileSync('server.ts', 'utf8');
const repoServer = fs.readFileSync('/tmp/Aura-Downloader/server.ts', 'utf8');

const myNative = myServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];
const repoNative = repoServer.match(/async function extractPinterestNative[\s\S]*?\n\}/)[0];

const myBtch = myServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];
const repoBtch = repoServer.match(/async function extractPinterestBtch[\s\S]*?\n\}/)[0];

let updatedServer = myServer.replace(myNative, repoNative).replace(myBtch, repoBtch);

fs.writeFileSync('server.ts', updatedServer);
console.log("Reverted Pinterest backend to Github repo version.");
