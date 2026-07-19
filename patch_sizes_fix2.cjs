const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /if \(url\.startsWith\('\/api\/'\) \|\| url\.includes\('\/api\/proxy-download'\) \|\| url\.includes\('m3u8'\)\) \{\s*return "Unknown Size";\s*\}/,
    `if (url.includes('m3u8')) return "Unknown Size";
    let targetUrl = url;
    if (url.startsWith('/api/proxy-download') || url.includes('/api/proxy-download')) {
        const match = url.match(/[?&]url=([^&]+)/);
        if (match) {
             targetUrl = decodeURIComponent(match[1]);
        }
    } else if (url.startsWith('/api/')) {
        return "Unknown Size";
    }`
);

code = code.replace(/client\.request\(url,/g, 'client.request(targetUrl,');

fs.writeFileSync('server.ts', code);
