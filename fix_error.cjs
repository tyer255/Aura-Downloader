const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/} else if \(platform === 'snapchat'\) \{\s*racePromises\.push\(extractGenericRapidAPI\(trimmedUrl, "snapchat"\)\);/g, "} else if (platform === 'snapchat') {");

fs.writeFileSync('server.ts', code);
