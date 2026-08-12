const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const handleStalledCode = \`
  const handleStalled = () => {
    if (isPlaying) {
      setIsLoading(true);
    }
  };\`;

code = code.replace(/const handleWaiting = \(\) => \{[\\s\\S]*?\};\n/, \`const handleWaiting = () => {
    if (isPlaying) {
      setIsLoading(true);
    }
  };\n\${handleStalledCode}\n\`);

code = code.replace(/onWaiting=\{handleWaiting\}/g, 'onWaiting={handleWaiting}\n            onStalled={handleStalled}');

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched stalled");
