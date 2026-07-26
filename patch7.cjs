const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `             return res.status(400).json({ success: false, message: "Could not extract Snapchat content. It may be private or unavailable." });`,
  `             return res.status(400).json({ success: false, message: "Extraction failed: This Snapchat content is private or unavailable." });`
);

fs.writeFileSync('server.ts', serverContent);
console.log("Patched Snapchat story error message");
