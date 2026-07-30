import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`      // If we already have the URL for the requested quality (usually the default one)
      if (downloadInfo.url) {
        qualities.unshift({
           label: \`\${downloadInfo.quality || '360'}p (MP4)\`,
           url: \`/api/proxy-download?url=\${encodeURIComponent(downloadInfo.url)}&filename=\${encodeURIComponent(title)}\`,
           ext: "mp4",
           size: "Ready"
        });
      }`,
`      // If we already have the URL for the requested quality (usually the default one)
      if (downloadInfo.url) {
        qualities.unshift({
           label: \`\${downloadInfo.quality || '360'}p (MP4)\`,
           url: \`/api/proxy-download?url=\${encodeURIComponent(downloadInfo.url)}&filename=\${encodeURIComponent(title)}\`,
           ext: "mp4",
           size: "Ready"
        });
        qualities.push({
           label: "Audio (MP3)",
           url: \`/api/proxy-download?url=\${encodeURIComponent(downloadInfo.url)}&filename=\${encodeURIComponent(title)}.mp3&extractAudio=true\`,
           ext: "mp3",
           size: "Audio Only"
        });
      }`
);

code = code.replace(
`      // Sort heights descending
      const sortedHeights = Array.from(heights.keys()).sort((a, b) => b - a);
      
      sortedHeights.forEach((h: number) => {
         const f = heights.get(h);
         let qUrl = f.url;
         
         // If video has no audio, proxy it to mux with best audio
         if (f.acodec === 'none' && bestAudio) {
            qUrl = \`/api/proxy-download?url=\${encodeURIComponent(f.url)}&audioUrl=\${encodeURIComponent(bestAudio.url)}&mux=true&filename=video_\${h}p.mp4\`;
         }
         
         qualities.push({
            label: \`\${h}p\`,
            url: qUrl,
            ext: "mp4",
            size: \`~ \${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)} MB\`
         });
      });`,
`      // Sort heights descending
      const sortedHeights = Array.from(heights.keys()).sort((a, b) => b - a);
      
      sortedHeights.forEach((h: number) => {
         const f = heights.get(h);
         let qUrl = f.url;
         
         // If video has no audio, proxy it to mux with best audio
         if (f.acodec === 'none' && bestAudio) {
            qUrl = \`/api/proxy-download?url=\${encodeURIComponent(f.url)}&audioUrl=\${encodeURIComponent(bestAudio.url)}&mux=true&filename=video_\${h}p.mp4\`;
         }
         
         qualities.push({
            label: \`\${h}p\`,
            url: qUrl,
            ext: "mp4",
            size: \`~ \${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)} MB\`
         });
      });
      
      if (bestAudio) {
         qualities.push({
            label: "Audio (MP3)",
            url: \`/api/proxy-download?url=\${encodeURIComponent(bestAudio.url)}&filename=\${encodeURIComponent(data.title || "audio")}.mp3&extractAudio=true\`,
            ext: "mp3",
            size: "Audio Only"
         });
      }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
