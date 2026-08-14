const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

// Insert an effect to auto-play when resolvedUrl is ready and isPlaying is set to true
const newEffect = `
  useEffect(() => {
    if (resolvedUrl && isPlaying && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(err => {
        console.error("Autoplay failed:", err);
        setIsPlaying(false);
      });
    }
  }, [resolvedUrl, isPlaying]);

  useEffect(() => {`;

code = code.replace(/useEffect\(\(\) => \{\n    if \(syncedLyrics\)/, newEffect + "\n    if (syncedLyrics)");

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched auto-play effect");
