const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

serverFile = serverFile.replace(/replace\(\/\[\\\\r\\\\n\]\+\/g/g, "replace(/[\\r\\n]+/g");

fs.writeFileSync('server.ts', serverFile);
