const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `          url: \`/api/youtube-stream?url=\${encodeURIComponent(url)}&quality=\${qStr}&filename=\${encodeURIComponent(title)}\`,`;
const replacement1 = `          url: \`/api/get-youtube-link?url=\${encodeURIComponent(url)}&quality=\${qStr}&filename=\${encodeURIComponent(title)}\`,`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    console.log("Replaced youtube-stream with get-youtube-link in vreden extractor");
}

const target2 = `  app.get("/api/youtube-stream", async (req, res) => {`;
const replacement2 = `  app.get("/api/get-youtube-link", async (req, res) => {
    const videoUrl = req.query.url as string;
    const quality = (req.query.quality as string) || "360";
    
    if (!videoUrl) return res.status(400).json({ success: false, message: "Missing url parameter" });
    
    try {
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {};
      console.log = () => {};
      let result;
      try {
        result = await vredenYtmp4(videoUrl, quality);
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }
      
      if (result && result.status && result.download && result.download.url) {
        return res.json({ success: true, url: result.download.url });
      } else {
        return res.status(500).json({ success: false, message: "Failed to fetch direct URL." });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/youtube-stream", async (req, res) => {`;

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
    console.log("Added /api/get-youtube-link endpoint");
}

fs.writeFileSync('server.ts', code);
