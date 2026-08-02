const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  '}, 35000, 2, (msg) => {',
  '}, 60000, 2, (msg) => {'
);
fs.writeFileSync('src/App.tsx', content);
