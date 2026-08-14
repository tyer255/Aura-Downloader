const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const target = `      {/* Immersive Lyrics Pane */}
      <AnimatePresence>
        {showLyrics && parsedLyrics.length > 0 && typeof document !== 'undefined' && createPortal(
          <motion.div`;

const replacement = `      {/* Immersive Lyrics Pane */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLyrics && parsedLyrics.length > 0 && (
            <motion.div`;

code = code.replace(target, replacement);

const target2 = `          </motion.div>,
          document.body
        )}
      </AnimatePresence>`;

const replacement2 = `            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched portal");
