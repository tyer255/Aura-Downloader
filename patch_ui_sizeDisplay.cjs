const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const sizeDisplay = q.size \|\| fetchedSizes\[q.url\] \|\| \(q.isAudio \? "MP3 Audio" : "Original Quality"\);/g,
  `const sizeDisplay = q.size || fetchedSizes[q.url] || (q.isAudio ? "MP3 Audio" : "Unknown Size");`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated sizeDisplay in App.tsx");
