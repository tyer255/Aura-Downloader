import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/html = html\.replace\(\/<meta.*?;/g, (match) => {
    // This is getting messy, let's just replace the whole block of replacements
    return match;
});

const blockStart = "      if (routeData) {";
const blockEnd = "      const ogImage = 'https://aura-download.ai.studio/banner.jpg';";

const newBlock = `      if (routeData) {
         html = html.replace(/<title>.*?<\\/title>/i, \`<title>\${routeData.title}</title>\`);
         html = html.replace(/<meta\\s+name="description"\\s+content=".*?"\\s*\\/?>/i, \`<meta name="description" content="\${routeData.desc}" />\`);
         html = html.replace(/<meta\\s+name="keywords"\\s+content=".*?"\\s*\\/?>/i, \`<meta name="keywords" content="\${routeData.keywords}" />\`);
         html = html.replace(/<meta\\s+property="og:title"\\s+content=".*?"\\s*\\/?>/i, \`<meta property="og:title" content="\${routeData.title}" />\`);
         html = html.replace(/<meta\\s+property="og:description"\\s+content=".*?"\\s*\\/?>/i, \`<meta property="og:description" content="\${routeData.desc}" />\`);
         html = html.replace(/<meta\\s+name="twitter:title"\\s+content=".*?"\\s*\\/?>/i, \`<meta name="twitter:title" content="\${routeData.title}" />\`);
         html = html.replace(/<meta\\s+name="twitter:description"\\s+content=".*?"\\s*\\/?>/i, \`<meta name="twitter:description" content="\${routeData.desc}" />\`);
      }
      
      // Also inject og:image if not present, though it's likely handled by index.html or client, 
      // let's ensure it's there.`;

const startIndex = server.indexOf(blockStart);
const endIndex = server.indexOf(blockEnd);

if (startIndex !== -1 && endIndex !== -1) {
    server = server.substring(0, startIndex) + newBlock + server.substring(endIndex);
    fs.writeFileSync('server.ts', server);
    console.log('Regex block replaced successfully!');
} else {
    console.log('Could not find block limits.');
}
