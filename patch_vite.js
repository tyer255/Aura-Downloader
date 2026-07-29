import fs from 'fs';
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace(
  "navigateFallbackDenylist: [/^\/api/],",
  "navigateFallbackDenylist: [/^\/api/, /^\/sitemap\\.xml$/, /^\/robots\\.txt$/],"
);
fs.writeFileSync('vite.config.ts', code);
console.log('Patched vite.config.ts');
