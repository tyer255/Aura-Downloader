const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(!fallbackResult \|\| !fallbackResult\.success\) \{\n    if \(lastAiError\) \{\n      return \{ success: false, message: "AI extraction failed: " \+ lastAiError, error: lastAiError \};\n    \}\n  \}\n  return fallbackResult;/g, "return fallbackResult;");

fs.writeFileSync('server.ts', code);
console.log("Patched lastAiError.");
