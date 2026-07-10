const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch yt-dlp qualities
code = code.replace(/if \(qualities\.length > 0\) \{\n         mediaUrl = qualities\[0\]\.url; \/\/ highest quality\n      \}/, 
`if (bestAudio) {
        qualities.push({
          label: \`Audio Only (m4a/mp3)\`,
          url: \`/api/proxy-download?url=\${encodeURIComponent(bestAudio.url)}&filename=\${encodeURIComponent(data.title || "audio")}.mp3\`,
          ext: "mp3",
          size: bestAudio.abr ? bestAudio.abr + 'kbps' : "Audio"
        });
      }
      
      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // highest quality
      }`);

// Patch getFallbackQualities
code = code.replace(/\{ label: "360p \(Mobile Video\)", url: url, ext: "mp4", size: "Low Bandwidth" \}/,
`{ label: "360p (Mobile Video)", url: url, ext: "mp4", size: "Low Bandwidth" },
      { label: "Audio Only (MP3)", url: url, ext: "mp3", size: "Audio" }`);

fs.writeFileSync('server.ts', code);
console.log("Patched audio option.");
