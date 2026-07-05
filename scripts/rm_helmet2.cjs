const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<Helmet>[\s\S]*?<\/Helmet>/g;
let match;
let matchCount = 0;
while ((match = regex.exec(content)) !== null) {
  matchCount++;
  if (matchCount === 1) { // this is the bad one
    content = content.substring(0, match.index) + content.substring(match.index + match[0].length);
    break;
  }
}

fs.writeFileSync('src/App.tsx', content);
