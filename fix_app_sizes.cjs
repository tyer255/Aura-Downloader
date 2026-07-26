const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    list.forEach(q => {
      if (q.url && !q.size && !fetchedSizes[q.url]) {
         fetchSize(q.url);
      }
    });`;

const replacement = `    list.forEach(q => {
      // Treat placeholder texts as missing sizes so we fetch the real size
      const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
      if (q.url && (!q.size || isPlaceholder) && !fetchedSizes[q.url]) {
         fetchSize(q.url);
      }
    });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx to fetch size even if placeholder exists");
