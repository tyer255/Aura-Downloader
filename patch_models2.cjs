const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const modelsToTry = ["gemini-2.5-flash", "gemini-pro"];',
  'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];'
);

fs.writeFileSync('server.ts', code);
