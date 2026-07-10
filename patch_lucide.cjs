const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, (match, p1) => {
  if (p1.includes('Settings')) return match;
  return "import {" + p1 + ", Settings } from 'lucide-react';";
});
fs.writeFileSync('src/App.tsx', code);
console.log("Patched lucide imports.");
