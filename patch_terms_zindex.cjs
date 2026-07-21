const fs = require('fs');
let code = fs.readFileSync('src/components/TermsModal.tsx', 'utf8');

code = code.replace(/className="fixed inset-0 z-\[100\]/g, 'className="fixed inset-0 z-[999999999]');
fs.writeFileSync('src/components/TermsModal.tsx', code);
console.log("Patched terms modal z-index!");
