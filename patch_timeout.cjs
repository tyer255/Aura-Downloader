const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/{ timeout: 2000 }/g, '{ timeout: 1000 }');

fs.writeFileSync('server.ts', code);
console.log("Patched timeout");
