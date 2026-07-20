const fs = require('fs');
let server = fs.readFileSync('/app/applet/server.ts', 'utf8');
server = server.replace(
    'console.log("yt-dlp failed or not a video, falling back to btch-downloader for Pinterest...");',
    'console.log("yt-dlp did not return a video, trying btch-downloader for Pinterest...");'
);
fs.writeFileSync('/app/applet/server.ts', server);
