const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const target = `{/* Immersive Lyrics Pane */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLyrics && parsedLyrics.length > 0 && (
            <motion.div`;

const replacement = `{/* Immersive Lyrics Pane */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLyrics && parsedLyrics.length > 0 && (
            <motion.div key="immersive-lyrics"`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Added specific key");
