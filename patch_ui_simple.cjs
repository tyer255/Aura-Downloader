const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<p className="text-sm font-bold tracking-wide uppercase text-emerald-600 dark:text-emerald-400">Analyzing streams</p>
                                 <p className="text-xs text-neutral-500 dark:text-neutral-400">Fetching exact file sizes and qualities...</p>`;

const replacement = `<p className="text-sm font-bold tracking-wide text-emerald-600 dark:text-emerald-400">Preparing download options...</p>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated UI for simpler text");
