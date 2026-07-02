const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// We want to replace `\n                                  download\n` with `\n                                  target="_blank"\n                                  rel="noopener noreferrer"\n`
// Or just replace ` download` with ` target="_blank" rel="noopener noreferrer"` if it's an attribute.
// Let's use a regex that matches `download` as a standalone JSX attribute.
code = code.replace(/(\s+)download(\s+className=)/g, '$1target="_blank" rel="noopener noreferrer"$2');
code = code.replace(/(\s+)download(\s+onClick=)/g, '$1target="_blank" rel="noopener noreferrer"$2');

fs.writeFileSync('src/App.tsx', code);
