import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const regexes = [
  /<title>.*?<\/title>/,
  /<meta name="description" .*?\/>/,
  /<meta name="keywords" .*?\/>/,
  /<meta property="og:title" .*?\/>/,
  /<meta property="og:description" .*?\/>/,
  /<meta property="og:type" .*?\/>/,
  /<meta property="og:url" .*?\/>/,
  /<meta name="twitter:card" .*?\/>/,
  /<meta name="twitter:title" .*?\/>/,
  /<meta name="twitter:description" .*?\/>/
];

regexes.forEach(r => {
   html = html.replace(r, match => match.replace('<', '<').replace('>', ' data-rh="true">'));
});
// Let's just remove them from index.html completely and rely on App.tsx providing the defaults?
// But then SSR in server.ts might fail if it relies on replacing them.
