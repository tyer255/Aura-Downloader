const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetClassify = `  } else if (url.includes("spotify.com")) {
    platform = 'spotify';`;
const replaceClassify = `  } else if (url.includes("spotify.com")) {
    platform = 'spotify';
    if (url.includes("/playlist/")) type = 'playlist';
    else if (url.includes("/artist/") || url.includes("/user/")) type = 'profile';
  } else if (url.includes("threads.net")) {
    platform = 'threads';
    if (url.includes("/post/")) type = 'media';
    else type = 'profile';`;
code = code.replace(targetClassify, replaceClassify);

const targetExtraction = `        if (platform === 'spotify') {
            console.log("Spotify URL detected, using Spotify extractor...");
            racePromises.push(extractSpotify(trimmedUrl));
        }`;
const replaceExtraction = `        if (platform === 'spotify') {
            console.log("Spotify URL detected, using Spotify extractor...");
            racePromises.push(extractSpotify(trimmedUrl));
        }
        
        if (platform === 'threads') {
            console.log("Threads URL detected, using yt-dlp...");
            racePromises.push(extractWithYtDlp(trimmedUrl));
        }`;
code = code.replace(targetExtraction, replaceExtraction);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with Threads");
