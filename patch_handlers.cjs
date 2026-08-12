const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const newHandlers = `  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };
`;

code = code.replace(`  const handleCanPlay = () => {
    setIsLoading(false);
  };`, newHandlers);

code = code.replace(
  `            onCanPlay={handleCanPlay}`,
  `            onCanPlay={handleCanPlay}
            onCanPlayThrough={handleCanPlayThrough}
            onPlaying={handlePlaying}
            onWaiting={handleWaiting}
            onLoadStart={handleLoadStart}`
);

code = code.replace(
  `          onCanPlay={handleCanPlay}`,
  `          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlayThrough}
          onPlaying={handlePlaying}
          onWaiting={handleWaiting}
          onLoadStart={handleLoadStart}`
);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched handlers");
