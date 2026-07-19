import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/AnimatePresence>\s*<\/div>\s*<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/g;
content = content.replace(regex, '</AnimatePresence>');

fs.writeFileSync('src/App.tsx', content);
console.log("Cleaned up garbage");
