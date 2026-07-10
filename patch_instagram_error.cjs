const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /let errorMessage = "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again.";[\s\n]*if \(platform === 'instagram'\) \{[\s\n]*errorMessage = "Instagram has strictly blocked public access. A login\/cookie is now required to fetch photos or videos. Please try a different platform or use a dedicated local tool.";[\s\n]*\}/;

const replacement = `let errorMessage = "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again.";
      if (platform === 'instagram') {
        errorMessage = "Instagram has strictly blocked public access. A login/cookie is now required to fetch photos or videos. Please try a different platform or use a dedicated local tool.";
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
