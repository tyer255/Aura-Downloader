const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/await axios\.get\(\`https:\/\/lrclib\.net\/api\/search\?track_name=\$\{encodeURIComponent\(details\.trackName\)\}axios\.get\(\`https:\/\/lrclib\.net\/api\/search\?track_name=\$\{encodeURIComponent\(details\.trackName\)\}&artist_name=\$\{encodeURIComponent\(details\.primaryArtist\)\}\`\)artist_name=\$\{encodeURIComponent\(details\.primaryArtist\)\}\`, \{ timeout: 2000 \}\)/g, 
  "await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(details.trackName)}&artist_name=${encodeURIComponent(details.primaryArtist)}`, { timeout: 2000 })");

code = code.replace(/await axios\.get\(\`https:\/\/lrclib\.net\/api\/search\?track_name=\$\{encodeURIComponent\(trackName\)\}axios\.get\(\`https:\/\/lrclib\.net\/api\/search\?track_name=\$\{encodeURIComponent\(trackName\)\}&artist_name=\$\{encodeURIComponent\(artistName\)\}\`\)artist_name=\$\{encodeURIComponent\(artistName\)\}\`, \{ timeout: 2000 \}\)/g, 
  "await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`, { timeout: 2000 })");

fs.writeFileSync('server.ts', code);
