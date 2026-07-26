const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /size: "Standard HD"/g,
  `size: undefined`
).replace(
  /size: "Standard Definition"/g,
  `size: undefined`
).replace(
  /size: "Low Bandwidth"/g,
  `size: undefined`
).replace(
  /size: "Audio"/g,
  `size: undefined`
).replace(
  /size: "HD"/g,
  `size: undefined`
).replace(
  /size: "Video"/g,
  `size: undefined`
);

fs.writeFileSync('server.ts', code);
console.log("Updated mock sizes");
