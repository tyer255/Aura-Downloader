const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const newHandlers = `  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };`;

code = code.replace(`  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };`, newHandlers);


code = code.replace(
  `            onPlaying={handlePlaying}`,
  `            onPlaying={handlePlaying}
            onPause={handlePause}`
);

code = code.replace(
  `          onPlaying={handlePlaying}`,
  `          onPlaying={handlePlaying}
          onPause={handlePause}`
);


fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched handlers 2");
