const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
      const qualities = availableQualities.map((q: any) => {
        const qStr = String(q);
        const qLabel = qStr.endsWith('p') ? qStr : \`\${qStr}p\`;
        return {
          label: \`\${qLabel} (MP4)\`,
          url: \`/api/youtube-stream?url=\${encodeURIComponent(url)}&quality=\${qStr}&filename=\${encodeURIComponent(title)}\`,
          ext: "mp4",
          size: q >= 720 ? "High Definition" : "Standard Quality"
        };
      });
`;
const replacement = `
      const qualities = availableQualities.map((q: any) => {
        const qStr = String(q);
        const qLabel = qStr.endsWith('p') ? qStr : \`\${qStr}p\`;
        return {
          label: \`\${qLabel} (MP4)\`,
          url: \`/api/youtube-stream?url=\${encodeURIComponent(url)}&quality=\${qStr}&filename=\${encodeURIComponent(title)}\`,
          ext: "mp4",
          size: q >= 720 ? "High Definition" : "Standard Quality"
        };
      });
      
      // If we already have the URL for the requested quality (usually the default one)
      if (downloadInfo.url) {
        qualities.unshift({
           label: \`\${downloadInfo.quality || '360'}p (MP4)\`,
           url: \`/api/proxy-download?url=\${encodeURIComponent(downloadInfo.url)}&filename=\${encodeURIComponent(title)}\`,
           ext: "mp4",
           size: "Ready"
        });
      }
`;
code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
