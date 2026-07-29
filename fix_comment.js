import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace("// let's ensure it's there.      const ogImage", "// let's ensure it's there.\\n      const ogImage");
fs.writeFileSync('server.ts', server);
console.log('Fixed comment');
