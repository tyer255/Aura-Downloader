const fs = require('fs');
fs.writeFileSync('test.json', JSON.stringify({ ok: true }));
console.log(fs.readFileSync('test.json', 'utf8'));
