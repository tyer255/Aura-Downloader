import fs from 'fs';

// 1. Fix server.ts regex
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/html\.replace\(\/<title>.*?\<\/title>\/, /g, 'html.replace(/<title>.*?<\\/title>/, ');
fs.writeFileSync('server.ts', server);

// 2. Fix App.tsx duplicate alt
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
    /<img alt=\{activeItem.title \|\| "Full size media preview"\} src=\{getProxiedUrl\(activeItem\.url\)\}\n\s*alt=\{activeItem\.title \|\| "Full Resolution Preview"\}/g,
    '<img alt={activeItem.title || "Full size media preview"} src={getProxiedUrl(activeItem.url)}'
);
fs.writeFileSync('src/App.tsx', app);

console.log('Errors fixed!');
