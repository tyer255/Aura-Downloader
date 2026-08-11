const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(extractAudio\) \{\s*res\.setHeader\('Content-Type', 'audio\/mpeg'\);\s*let finalFilename = typeof customFilename === "string" \? customFilename : "download";\s*if \(!finalFilename\.includes\("\."\)\) \{\s*finalFilename \+= "\.mp4"; \/\/ generic fallback\s*\}/, 
`if (extractAudio) {
      res.setHeader('Content-Type', 'audio/mpeg');
      let finalFilename = typeof customFilename === "string" ? customFilename : "download";
      if (!finalFilename.includes(".")) {
          finalFilename += ".mp3"; // audio fallback
      }`);

fs.writeFileSync('server.ts', code);
console.log("Patched audio fallback!");
