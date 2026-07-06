const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

// Replace newlines inside the regex with \r\n explicitly
serverFile = serverFile.replace(/\.replace\(\/\[\r?\n\]\+\/g/g, ".replace(/[\\\\r\\\\n]+/g");
serverFile = serverFile.replace(/\.replace\(\/\[\r?\n\r?\n\]\+\/g/g, ".replace(/[\\\\r\\\\n]+/g");

fs.writeFileSync('server.ts', serverFile);
