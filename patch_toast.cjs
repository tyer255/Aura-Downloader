const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `setHistoryToast(url.startsWith("/api/spotify-resolve") ? "Resolving Spotify audio... (takes ~10 seconds)" : "Preparing YouTube stream... (takes ~10 seconds)");`,
  `setHistoryToast(url.startsWith("/api/spotify-resolve") ? "Resolving Spotify audio..." : "Preparing YouTube stream...");`
);

code = code.replace(
  `setHistoryToast("Waking up server... (takes ~10 seconds)");`,
  `setHistoryToast("Waking up server...");`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched toasts!");
