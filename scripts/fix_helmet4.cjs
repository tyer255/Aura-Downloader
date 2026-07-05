const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The end of the file looks like:
//     </>\n  );\n}\n</>\n    );\n  }\nexport default function App()
content = content.replace(/<\/>\s*\);\s*\}\s*<\/>\s*\);\s*\}/, '</>\n  );\n}');
// Or better, just restore the end
content = content.replace(/<\/>\n    \);\n  \}\nexport default function App/g, 'export default function App');
fs.writeFileSync('src/App.tsx', content);
