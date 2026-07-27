const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'snapchat' | 'unknown' = 'unknown';`;
const replacement = `let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'snapchat' | 'spotify' | 'unknown' = 'unknown';`;

const target2 = `    platform = 'pinterest';
    if (!url.includes("/pin/") && !url.includes("pin.it")) {`;

const replacement2 = `    platform = 'pinterest';
    if (!url.includes("/pin/") && !url.includes("pin.it")) {
      const path = urlStr.split("pinterest.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) type = 'profile';
      }
    }
  } else if (url.includes("spotify.com")) {
    platform = 'spotify';
    if (url.includes("/playlist/")) type = 'playlist';
    else if (url.includes("/artist/") || url.includes("/user/")) type = 'profile';`;

code = code.replace(target, replacement);

const pinterestTarget = `  } else if (url.includes("pinterest.com") || url.includes("pin.it")) {
    platform = 'pinterest';
    if (!url.includes("/pin/") && !url.includes("pin.it")) {
      const path = urlStr.split("pinterest.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }`;

code = code.replace(pinterestTarget, pinterestTarget + `
  } else if (url.includes("spotify.com")) {
    platform = 'spotify';
    if (url.includes("/playlist/")) type = 'playlist';
    else if (url.includes("/artist/") || url.includes("/user/")) type = 'profile';`);


fs.writeFileSync('server.ts', code);
console.log("Patched classifyUrl with spotify");
