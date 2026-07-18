const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace('yt-dlp -j', 'yt-dlp -J');
fs.writeFileSync('/app/applet/server.ts', code);
