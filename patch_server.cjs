const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For extractYoutubeBtch
code = code.replace(
  /size: "High Definition"/g,
  `size: undefined`
).replace(
  /size: "Audio Only"/g,
  `size: undefined`
);

// For extractWithVreden
code = code.replace(
  /size: q >= 720 \? "High Definition" : "Standard Quality"/g,
  `size: undefined`
).replace(
  /size: "Ready"/g,
  `size: undefined`
);

fs.writeFileSync('server.ts', code);
console.log("Updated server.ts sizes");
