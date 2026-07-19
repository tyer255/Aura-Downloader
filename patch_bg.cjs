const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/_50vh/g, '_50%');
code = code.replace(/_100vh/g, '_100%');

fs.writeFileSync('src/App.tsx', code);
