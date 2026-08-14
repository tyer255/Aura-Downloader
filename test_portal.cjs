const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => setShowLyrics\(\!showLyrics\)\}/, 
`onClick={() => {
  console.log("Lyrics button clicked. Currently:", showLyrics);
  setShowLyrics(!showLyrics);
}}`);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched test_portal");
