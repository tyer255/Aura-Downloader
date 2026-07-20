const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  'console.log(`Processing extraction for platform: ${platform}, type: ${type}, url: ${trimmedUrl}`);',
  `console.log("--> API START: ", trimmedUrl);\n      console.log(\`Processing extraction for platform: \${platform}, type: \${type}, url: \${trimmedUrl}\`);`
);

server = server.replace(
  'const originalJson = res.json.bind(res);',
  'console.log("--> API HIT JSON REWRITE");\n    const originalJson = res.json.bind(res);'
);

server = server.replace(
  'enrichResultSizes(body).then(enriched => {',
  'console.log("--> API START ENRICH");\n            enrichResultSizes(body).then(enriched => {\n                console.log("--> API DONE ENRICH");'
);

fs.writeFileSync('server.ts', server);
console.log("patched!");
