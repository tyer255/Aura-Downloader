const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the function
code = code.replace(/async function extractGenericRapidAPI[\s\S]*?async function extractInstagramRapidAPI/, 'async function extractInstagramRapidAPI');

// Remove the pushes
code = code.replace(/\s*racePromises\.push\(extractGenericRapidAPI[^\)]+\)\);/g, '');

fs.writeFileSync('server.ts', code);
console.log("Removed generic rapid API");
