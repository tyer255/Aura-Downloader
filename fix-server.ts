import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const target = `      // ========================================================
      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
      // ========================================================
                noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
              'referer:google.com',
              'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            ]
          }), 15000) as any;`;

const replacement = `      // ========================================================
      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
      // ========================================================
      if (classification.platform !== 'youtube') {
        try {
          const output = await withTimeout(youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
              'referer:google.com',
              'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            ]
          }), 15000) as any;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content);
  console.log("Fixed syntax error");
} else {
  console.log("Target not found!");
}
