const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the fallback to btch.youtube entirely
code = code.replace(/\/\/ Fallback to btch\.youtube[\s\S]*?\} catch \(e\) \{\}/, '');

fs.writeFileSync('server.ts', code);
