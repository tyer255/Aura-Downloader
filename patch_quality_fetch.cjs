const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFetch1 = `          const ytres = await fetch(resolveUrl);`;
const newFetch1 = `          const ytres = await fetchWithTimeoutAndRetry(resolveUrl, {}, 15000, 1);`;

const oldFetch2 = `        const headRes = await fetch(proxyCheckUrl, { method: 'HEAD' });`;
const newFetch2 = `        const headRes = await fetchWithTimeoutAndRetry(proxyCheckUrl, { method: 'HEAD' }, 10000, 1);`;

content = content.replace(oldFetch1, newFetch1).replace(oldFetch2, newFetch2);

fs.writeFileSync('src/App.tsx', content);
