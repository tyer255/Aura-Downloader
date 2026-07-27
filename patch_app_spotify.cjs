const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `        if (q.url && (!q.size || isPlaceholder) && !fetchedSizes[q.url]) {`;
const replace1 = `        const isSpotify = q.url && q.url.startsWith('/api/spotify-resolve');
        if (q.url && (!q.size || isPlaceholder) && !fetchedSizes[q.url] && !isSpotify) {`;

const target2 = `    if (url.startsWith("/api/get-youtube-link")) {`;
const replace2 = `    if (url.startsWith("/api/get-youtube-link") || url.startsWith("/api/spotify-resolve")) {`;

const target3 = `      setHistoryToast("Preparing YouTube stream... (takes ~10 seconds)");`;
const replace3 = `      setHistoryToast(url.startsWith("/api/spotify-resolve") ? "Resolving Spotify audio... (takes ~10 seconds)" : "Preparing YouTube stream... (takes ~10 seconds)");`;

code = code.replace(target1, replace1).replace(target2, replace2).replace(target3, replace3);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with Spotify support");
