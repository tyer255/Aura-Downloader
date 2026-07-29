import fs from 'fs';

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/https:\/\/aura-download\.ai\.studio/g, 'https://aura-downloader-yg40.onrender.com');
fs.writeFileSync('server.ts', server);

let sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
sitemap = sitemap.replace(/https:\/\/aura-download\.ai\.studio/g, 'https://aura-downloader-yg40.onrender.com');
fs.writeFileSync('public/sitemap.xml', sitemap);

let robots = fs.readFileSync('public/robots.txt', 'utf8');
robots = robots.replace(/https:\/\/aura-download\.ai\.studio/g, 'https://aura-downloader-yg40.onrender.com');
fs.writeFileSync('public/robots.txt', robots);

console.log('Domains patched');
