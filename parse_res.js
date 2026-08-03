const fs = require('fs');
const res = JSON.parse(fs.readFileSync('response.json', 'utf8'));
console.log("Media count:", res.media ? res.media.length : 0);
console.log("Source:", res.source);
if (res.media) {
  const ids = res.media.map(m => m.id);
  console.log("IDs:", ids);
}
