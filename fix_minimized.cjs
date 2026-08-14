const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

// Hide extra-controls in minimized mode
code = code.replace(
  '.minimized-player .extra-controls {\n            display: flex !important;',
  '.minimized-player .extra-controls {\n            display: none !important;'
);

// We need to target the rewind button. Let's add a class to it so we can hide it on mobile.
code = code.replace(
  'className="skip-btn w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] hover:text-white disabled:opacity-50" \n                  title="Rewind 10s"',
  'className="skip-btn skip-btn-rewind w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] hover:text-white disabled:opacity-50" \n                  title="Rewind 10s"'
);

// And update the CSS to hide rewind on mobile when minimized
code = code.replace(
  '.minimized-player .skip-btn {',
  `@media (max-width: 480px) {
            .minimized-player .skip-btn.skip-btn-rewind {
                display: none !important;
            }
        }
        .minimized-player .skip-btn {`
);

// Also add min-width: 0 to track info to allow truncation
code = code.replace(
  '.minimized-player .track-info {',
  '.minimized-player .track-info {\n            min-width: 0;'
);
code = code.replace(
  '.minimized-player .track-info > div {',
  '.minimized-player .track-info > div {\n            min-width: 0;'
);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Fixed minimized player overflow");
