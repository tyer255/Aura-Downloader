const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];',
  'const modelsToTry = ["gemini-2.5-flash", "gemini-pro"];'
);

// We can also add a check to not retry if error is 429 for all models, but let's just let it fall through for now
fs.writeFileSync('server.ts', code);
