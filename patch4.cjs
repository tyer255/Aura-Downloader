const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const contentType = response.headers["content-type"] || "application/octet-stream";
      const contentLength = response.headers["content-length"];

      let ext = "mp4";`;

const replacement = `      const contentType = response.headers["content-type"] || "application/octet-stream";
      if (contentType.toLowerCase().includes("text/html")) {
        console.error(\`Source server returned HTML instead of media for URL: \${targetUrl}\`);
        response.destroy();
        return res.status(403).send(\`Error 403: Link expired or access denied by source server.\`);
      }
      const contentLength = response.headers["content-length"];

      let ext = "mp4";`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched pipeUrlStream successfully!");
} else {
  console.log("Target not found!");
}
