const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => \{\n  console\.log\("Lyrics button clicked\. Currently:", showLyrics\);\n  setShowLyrics\(!showLyrics\);\n\}\}/, 
`onClick={() => setShowLyrics(!showLyrics)}`);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Cleaned log");
