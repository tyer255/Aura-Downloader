const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/p-4\.5/g, 'p-4');
content = content.replace(/"text-sm font-medium flex items-center space-x-2 truncate max-w-\[70%\]",/g, '"text-sm font-medium flex items-center space-x-2 truncate min-w-0 max-w-[70%]",');
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched successfully");
