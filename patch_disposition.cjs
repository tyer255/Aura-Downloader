const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPipe = `const encodedFilename = encodeURIComponent(filename.replace(/[\\r\\n]+/g, ''));
      const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_"); 
      const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

const replacementPipe = `
      // Fully encode for filename* according to RFC 5987
      const encodedFilename = encodeURIComponent(filename.replace(/[\\r\\n]+/g, ''))
          .replace(/['()]/g, escape)
          .replace(/\\*/g, '%2A');
      const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_"); 
      const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

code = code.replace(targetPipe, replacementPipe);

fs.writeFileSync('server.ts', code);
console.log("Patched content-disposition header in server.ts!");
