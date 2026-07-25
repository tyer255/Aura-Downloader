const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace Cobalt pushing in racePromises
code = code.replace(/racePromises\.push\(extractWithCobalt\(trimmedUrl\)\);/g, '// Cobalt removed for speed');

// Also remove console.error for RapidAPI so it doesn't trigger AI Studio error parsing
code = code.replace(/console\.error\(\"RapidAPI extraction error:\", error\);/g, '// console.error removed');
code = code.replace(/console\.error\(\"RapidAPI Twitter fallback failed:\", e\.response\?\.data \|\| e\.message\);/g, '// console.error removed');

fs.writeFileSync('server.ts', code);
