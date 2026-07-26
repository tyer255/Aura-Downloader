const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /activeDl\.status === "preparing"\s*\?\s*"Preparing stream \(fetching URL\)\.\.\."/g,
  `activeDl.status === "preparing" ? (activeDl.progress ? \`Preparing stream (\${activeDl.progress}%)\` : "Preparing stream...")`
);

code = code.replace(
  /activeDl\.status === "preparing"\s*\?\s*"Preparing stream\.\.\."/g,
  `activeDl.status === "preparing" ? (activeDl.progress ? \`Preparing stream (\${activeDl.progress}%)\` : "Preparing stream...")`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated UI for preparing progress");
