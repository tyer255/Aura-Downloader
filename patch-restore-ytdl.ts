import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// add import
if (!code.includes('import youtubedl from "youtube-dl-exec";')) {
  code = code.replace(/import express from "express";\n/, 'import express from "express";\nimport youtubedl from "youtube-dl-exec";\n');
}

const targetLocation = `      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
      // ========================================================`;

const replacement = `      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
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
          }), 15000) as any;

          let directUrl = output.url;
          const qualities = extractQualitiesFromYtDlp(output);
          if (!directUrl && qualities.length > 0) {
            directUrl = qualities[0].url;
          }

          if (directUrl) {
            return res.json({
              success: true,
              url: directUrl,
              title: output.title || "Media Download",
              thumbnail: output.thumbnail,
              mediaType: output.playlist ? "carousel" : "video",
              qualities: qualities,
              source: "yt-dlp"
            });
          }
        } catch (e) {}
      }`;

if (code.includes(targetLocation) && !code.includes("const output = await withTimeout(youtubedl")) {
  code = code.replace(targetLocation, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Restored youtube-dl-exec");
} else {
  console.log("Could not find insertion point or already inserted");
}
