const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `                if (!thumb && trackId) {
                    try {
                        const oemb = await axios.get(\`https://open.spotify.com/oembed?url=https://open.spotify.com/track/\${trackId}\`, { timeout: 2500 });
                        if (oemb.data && oemb.data.thumbnail_url) {
                            thumb = oemb.data.thumbnail_url;
                        }
                    } catch(e) {}
                }`;

if (code.includes(target)) {
  code = code.replace(target, `                // Oembed fetch removed for playlist extraction speed, fallback to playlist cover is sufficient`);
  fs.writeFileSync('server.ts', code);
  console.log("Patched oembed out!");
} else {
  console.log("Not found!");
}
