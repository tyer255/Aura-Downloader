import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<h1 className=\{clsx\(\n\s*"text-base sm:text-lg font-black tracking-tight uppercase",\n\s*isLight \? "text-neutral-900" : "text-white"\n\s*\)\}>AURA Downloader<\/h1>/g,
  '<span className={clsx(\n               "text-base sm:text-lg font-black tracking-tight uppercase",\n               isLight ? "text-neutral-900" : "text-white"\n           )}>AURA Downloader</span>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed H1 duplication');
