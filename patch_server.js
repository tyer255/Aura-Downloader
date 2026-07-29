import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');

const targetBlock = '      if (routeData) {\n' +
'         html = html.replace(/<title>.*?<\\/title>/i, `<title>${routeData.title}</title>`);\n' +
'         html = html.replace(/<meta\\s+name="description"\\s+content=".*?"\\s*\\/?>/i, `<meta name="description" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta\\s+name="keywords"\\s+content=".*?"\\s*\\/?>/i, `<meta name="keywords" content="${routeData.keywords}" />`);\n' +
'         html = html.replace(/<meta\\s+property="og:title"\\s+content=".*?"\\s*\\/?>/i, `<meta property="og:title" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta\\s+property="og:description"\\s+content=".*?"\\s*\\/?>/i, `<meta property="og:description" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta\\s+name="twitter:title"\\s+content=".*?"\\s*\\/?>/i, `<meta name="twitter:title" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta\\s+name="twitter:description"\\s+content=".*?"\\s*\\/?>/i, `<meta name="twitter:description" content="${routeData.desc}" />`);\n' +
'      }';

const newBlock = '      if (routeData) {\n' +
'         html = html.replace(/<title[^>]*>.*?<\\/title>/i, `<title data-rh="true">${routeData.title}</title>`);\n' +
'         html = html.replace(/<meta[^>]*name="description"[^>]*\\/?>/i, `<meta name="description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="keywords"[^>]*\\/?>/i, `<meta name="keywords" data-rh="true" content="${routeData.keywords}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:title"[^>]*\\/?>/i, `<meta property="og:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:description"[^>]*\\/?>/i, `<meta property="og:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:title"[^>]*\\/?>/i, `<meta name="twitter:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:description"[^>]*\\/?>/i, `<meta name="twitter:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'      }';

server = server.replace(targetBlock, newBlock);
fs.writeFileSync('server.ts', server);
console.log('Replaced block');
