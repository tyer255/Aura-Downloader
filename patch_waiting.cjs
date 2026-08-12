const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(/const handleWaiting = \(\) => \{\n    setIsLoading\(true\);\n  \};/, 
\`const handleWaiting = () => {
    if (isPlaying) {
      setIsLoading(true);
    }
  };\`);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched waiting");
