const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix in extractAudio
code = code.replace(
  /const encodedFilename = encodeURIComponent\(\(customFilename as string\)\.replace\(\/\[\\r\\n\]\+\/g, ''\)\);\s+const safeFilename = \(typeof customFilename === "string" \? customFilename : "download"\)\.replace\(\/\[\^a-zA-Z0-9_\.-\]\/g, "_"\); const disposition = inline \? "inline" : \`attachment; filename="\$\{safeFilename\}"; filename\?=UTF-8''\$\{encodedFilename\}\`;/g,
  (match, offset, string) => {
     if (string.substring(offset - 150, offset).includes("extractAudio")) {
        return `let finalFilename = customFilename;
      if (!finalFilename.toLowerCase().endsWith('.mp3')) finalFilename += '.mp3';
      const encodedFilename = encodeURIComponent((finalFilename as string).replace(/[\\r\\n]+/g, ''));
      const safeFilename = finalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_"); const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;
     }
     if (string.substring(offset - 150, offset).includes("mux && audioUrl")) {
        return `let finalFilename = customFilename;
      if (!finalFilename.toLowerCase().endsWith('.mp4')) finalFilename += '.mp4';
      const encodedFilename = encodeURIComponent((finalFilename as string).replace(/[\\r\\n]+/g, ''));
      const safeFilename = finalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_"); const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;
     }
     return match;
  }
);

// Fix in pipeUrlStream
const targetPipe = `const encodedFilename = encodeURIComponent(((customFilename || "download") as string).replace(/[\\r\\n]+/g, ''));
      const safeFilename = (typeof customFilename === "string" ? customFilename : "download").replace(/[^a-zA-Z0-9_.-]/g, "_"); const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

const replacementPipe = `const encodedFilename = encodeURIComponent(filename.replace(/[\\r\\n]+/g, ''));
      const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_"); 
      const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

code = code.replace(targetPipe, replacementPipe);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts successfully");
