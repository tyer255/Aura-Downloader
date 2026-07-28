import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /"w-full sm:w-auto px-4 py-3 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-\[1.02\] active:scale-\[0.98\] shrink-0 w-full overflow-hidden whitespace-normal text-center leading-snug"/g,
  '"w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0 overflow-hidden whitespace-normal text-center leading-snug"'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ZIP button classes!');
