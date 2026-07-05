const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');
if (!css.includes('.no-scrollbar')) {
  css += '\n\n.no-scrollbar::-webkit-scrollbar {\n  display: none;\n}\n.no-scrollbar {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n';
  fs.writeFileSync('src/index.css', css);
}
