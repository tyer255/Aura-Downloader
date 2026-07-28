import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Disable selection on tab buttons
code = code.replace(
  /"px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative"/g,
  '"px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative select-none"'
);

// Disable selection on support/install buttons
code = code.replace(
  /"px-3 sm:px-4 h-11 rounded-full flex items-center justify-center transition-all border shadow-md font-bold text-xs sm:text-sm gap-2 uppercase tracking-wide cursor-pointer"/g,
  '"px-3 sm:px-4 h-11 rounded-full flex items-center justify-center transition-all border shadow-md font-bold text-xs sm:text-sm gap-2 uppercase tracking-wide cursor-pointer select-none"'
);
code = code.replace(
  /"w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer"/g,
  '"w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer select-none"'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added select-none!');
