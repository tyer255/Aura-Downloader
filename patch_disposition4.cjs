const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const encodedFilename = encodeURIComponent\(\(customFilename as string\)\.replace\(\/\[\\r\\n\]\+\/g, ''\)\);\s*const safeFilename = \(typeof customFilename === "string" \? customFilename : "download"\)\.replace\(\/\[\^a-zA-Z0-9_\.-\]\/g, "_"\); const disposition = inline \? "inline" : \`attachment; filename="\$\{safeFilename\}"; filename\*=UTF-8''\$\{encodedFilename\}\`;/g, 
(match) => {
  return `
      let finalFilename = typeof customFilename === "string" ? customFilename : "download";
      if (!finalFilename.includes(".")) {
          finalFilename += ".mp4"; // generic fallback
      }
      const encodedFilename = encodeURIComponent(finalFilename.replace(/[\\r\\n]+/g, ''))
          .replace(/['()]/g, escape)
          .replace(/\\*/g, '%2A');
      const safeFilename = finalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;
  `;
});

fs.writeFileSync('server.ts', code);
console.log("Patched proxy-download inline headers!");
