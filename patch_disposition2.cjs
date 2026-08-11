const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `const encodedFilename = encodeURIComponent((finalFilename as string).replace(/[\\r\\n]+/g, ''));
      const safeFilename = finalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_"); const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

const replacement1 = `const encodedFilename = encodeURIComponent((finalFilename as string).replace(/[\\r\\n]+/g, ''))
          .replace(/['()]/g, escape)
          .replace(/\\*/g, '%2A');
      const safeFilename = finalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_"); 
      const disposition = inline ? "inline" : \`attachment; filename="\${safeFilename}"; filename*=UTF-8''\${encodedFilename}\`;`;

code = code.replace(new RegExp(target1.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), replacement1);

fs.writeFileSync('server.ts', code);
console.log("Patched other content-disposition headers!");
