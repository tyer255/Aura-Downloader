const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(/<motion\.div key="immersive-lyrics"/g, '<motion.div');
fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Reverted keys");
