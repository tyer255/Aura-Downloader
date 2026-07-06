const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

const oldCheck = `const isProfile = type === 'profile';`;
const newCheck = `const isProfile = type === 'profile' || type === 'community_post';`;

if (serverFile.includes(oldCheck)) {
  serverFile = serverFile.replace(oldCheck, newCheck);
  console.log("Updated isProfile check");
  fs.writeFileSync('server.ts', serverFile);
} else {
  console.log("Could not find old check.");
}
