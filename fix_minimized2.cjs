const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

code = code.replace(
  '.minimized-player .playback-controls {\n            width: auto !important;',
  '.minimized-player .playback-controls {\n            width: auto !important;\n            flex-shrink: 0 !important;'
);

code = code.replace(
  '.minimized-player .track-info h2 {\n            font-size: 1rem !important;',
  '.minimized-player .track-info h2 {\n            font-size: 1rem !important;\n            white-space: nowrap;\n            overflow: hidden;\n            text-overflow: ellipsis;\n            width: 100%;'
);

code = code.replace(
  '.minimized-player .track-info p {\n            font-size: 0.75rem !important;',
  '.minimized-player .track-info p {\n            font-size: 0.75rem !important;\n            white-space: nowrap;\n            overflow: hidden;\n            text-overflow: ellipsis;\n            width: 100%;'
);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Fixed minimized player overflow pt2");
