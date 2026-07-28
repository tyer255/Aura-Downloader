import fs from 'fs';
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

// The main non-compact download button
code = code.replace(
  /"px-4 py-2\.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-wider cursor-pointer shrink-0 disabled:cursor-not-allowed"/g,
  '"px-6 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-wider cursor-pointer shrink-0 disabled:cursor-not-allowed active:scale-95 hover:shadow-lg"'
);

// The compact download button
code = code.replace(
  /"p-2 rounded-xl text-xs font-bold flex items-center gap-1\.5 transition-all cursor-pointer border shadow-sm"/g,
  '"p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm active:scale-95"'
);

// Also the speed buttons in SpotifyAudioPlayer
code = code.replace(
  /"px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"/g,
  '"px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"'
);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log('Fixed Spotify buttons!');
