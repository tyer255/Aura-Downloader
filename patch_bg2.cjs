const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/_50%/g, '_70%');

fs.writeFileSync('src/App.tsx', code);
