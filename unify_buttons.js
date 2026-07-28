import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace Button classes in PlaylistItem
code = code.replace(
  /"w-full sm:w-auto px-5 py-2\.5 rounded-full font-bold text-xs uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"/g,
  '"w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"'
);

// Replace Copy/QR Code buttons in various places:
// Profile avatar/banner (they are side-by-side)
code = code.replace(
  /className="w-full sm:flex-1 px-4 py-3\.5 rounded-xl text-sm justify-center backdrop-blur-md"/g,
  'className="w-full sm:flex-1 px-5 py-3 rounded-xl text-sm font-bold justify-center backdrop-blur-md transition-all active:scale-95"'
);

// Carousel item buttons (Download, Copy, QR)
code = code.replace(
  /className=\{clsx\(\s*"w-full inline-flex items-center justify-center gap-2 border px-3 py-2\.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed"/g,
  'className={clsx(\n                                        "w-full inline-flex items-center justify-center gap-2 border px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed active:scale-95"'
);
code = code.replace(
  /className="w-full sm:flex-1 rounded-xl px-3 py-2\.5 text-xs justify-center"/g,
  'className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95"'
);

// Spotify multiple qualities buttons (Download, Copy, QR)
code = code.replace(
  /className="w-full sm:flex-1 rounded-xl px-4 py-3 text-xs justify-center font-bold"/g,
  'className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95"'
);

// Regular standard Download button
code = code.replace(
  /"flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-6 py-3\.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer disabled:cursor-not-allowed"/g,
  '"flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"'
);

// Regular Copy/QR
code = code.replace(
  /className="w-full sm:w-auto px-6 py-3 rounded-full text-xs"/g,
  'className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95"'
);
code = code.replace(
  /className="w-full sm:w-auto px-6 py-3\.5 rounded-full text-sm"/g,
  'className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95"'
);

// Snap Frame button
code = code.replace(
  /className="px-2 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-\[10px\] font-bold flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider"/g,
  'className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider active:scale-95 shadow-md"'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Standardized button padding and radius!');
