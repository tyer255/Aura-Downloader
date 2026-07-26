const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {`,
  `        } else if (platform === 'snapchat') {
           console.log("Snapchat URL detected as profile/story, extracting with yt-dlp playlist.");
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           } else {
             return res.status(400).json({ success: false, message: "Could not extract Snapchat content. It may be private or unavailable." });
           }
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {`
);

fs.writeFileSync('server.ts', serverContent);
console.log("Patched server.ts for snapchat profile block");
