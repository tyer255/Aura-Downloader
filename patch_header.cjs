const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

const oldHeader = `      const disposition = inline ? "inline" : \`attachment; filename="\${customFilename}"\`;
      res.setHeader('Content-Disposition', disposition);`;

const newHeader = `      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\r\n]+/g, ''));
      const disposition = inline ? "inline" : \`attachment; filename*=UTF-8''\${encodedFilename}\`;
      res.setHeader('Content-Disposition', disposition);`;

if (serverFile.includes(oldHeader)) {
  serverFile = serverFile.replace(oldHeader, newHeader);
  console.log("Updated Content-Disposition header in proxy-download mux branch");
  fs.writeFileSync('server.ts', serverFile);
} else {
  console.log("Could not find old header code block");
}
