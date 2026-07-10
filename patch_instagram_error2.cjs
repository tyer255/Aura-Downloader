const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `      let errorMessage = "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again.";
      if (platform === 'instagram') {
        errorMessage = "Instagram has strictly blocked public access. A login/cookie is now required to fetch photos or videos. Please try a different platform or use a dedicated local tool.";
      }
      return res.status(400).json({`;

const replacement = `      let errorMessage = "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again.";
      if (platform === 'instagram') {
        errorMessage = "Instagram recently updated their security and strictly blocks all public scraping. It is no longer possible to extract Instagram reels/posts without a logged-in account (cookies). All free public APIs are currently down.";
      }
      return res.status(400).json({`;

if (content.includes(target)) {
  fs.writeFileSync('server.ts', content.replace(target, replacement));
  console.log("Patched server.ts successfully");
} else {
  console.log("Target not found");
}
