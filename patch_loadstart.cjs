const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(/onLoadStart=\{handleLoadStart\}/g, '');
code = code.replace(/const handleLoadStart = \(\) => \{\n    setIsLoading\(true\);\n  \};/g, '');

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched loadstart");
