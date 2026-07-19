const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /sizeStr\.includes\('0 MB'\) \|\| sizeStr\.includes\('~ 0 MB'\)/g,
    "sizeStr === '0 MB' || sizeStr === '~ 0 MB'"
);

fs.writeFileSync('server.ts', code);
