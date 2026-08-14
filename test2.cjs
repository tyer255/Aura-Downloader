const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const target = `{/* Immersive Lyrics Pane */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLyrics && parsedLyrics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}`;

const replacement = `{/* Immersive Lyrics Pane */}
      <AnimatePresence>
        {showLyrics && parsedLyrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}`;

code = code.replace(target, replacement);

const target2 = `            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}`;

const replacement2 = `          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Removed createPortal");
