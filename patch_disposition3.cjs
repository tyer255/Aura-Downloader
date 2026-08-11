const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all occurrences of encodeURIComponent followed by safeFilename and disposition
code = code.replace(/const encodedFilename = encodeURIComponent\(\([^)]+\) as string\)\.replace\(\/\[\\r\\n\]\+\/g, ''\)\);\s*const safeFilename = [^;]+;\s*const disposition = inline \? "inline" : `attachment; filename="\$\{safeFilename\}"; filename\*=UTF-8''\$\{encodedFilename\}`;/g, 
(match) => {
  return match.replace("encodeURIComponent(", "encodeURIComponent(") + " // patched";
});

// simpler
code = code.replace(/const encodedFilename = encodeURIComponent\(\(finalFilename as string\)\.replace\(\/\[\\r\\n\]\+\/g, ''\)\);/g, 
  "const encodedFilename = encodeURIComponent((finalFilename as string).replace(/[\\r\\n]+/g, '')).replace(/['()]/g, escape).replace(/\\*/g, '%2A');");

fs.writeFileSync('server.ts', code);
console.log("Patched!");
