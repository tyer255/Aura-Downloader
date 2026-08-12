const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/get-youtube-link", async \(req, res\) => {[\s\S]*?return res\.status\(500\)\.json\({ success: false, message: err\.message }\);\n    }\n  }\);/;

const replacement = `app.get("/api/get-youtube-link", async (req, res) => {
    const isSSE = req.query.sse === 'true';
    if (isSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }
    const sendProgress = (percent, msg) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify({ progress: percent, message: msg })}\\n\\n\`);
      }
    };
    const sendError = (msg) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify({ success: false, message: msg })}\\n\\n\`);
        res.end();
      } else {
        res.status(500).json({ success: false, message: msg });
      }
    }
    const sendSuccess = (data) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
        res.end();
      } else {
        res.json(data);
      }
    }

    const videoUrl = req.query.url;
    const quality = req.query.quality || "360";
    
    if (!videoUrl) return sendError("Missing url parameter");
    
    try {
      sendProgress(20, "Initializing scraper...");

      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {};
      console.log = () => {};

      let result;
      try {
        sendProgress(50, "Extracting video stream...");
        if (quality === 'audio' || quality === 'mp3') {
          const { ytmp3 } = await import("@vreden/youtube_scraper");
          result = await ytmp3(videoUrl);
        } else {
          result = await vredenYtmp4(videoUrl, quality);
        }
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }

      sendProgress(90, "Finalizing extraction...");

      if (result && result.status && result.download && result.download.url) {
        sendProgress(100, "Done!");
        return sendSuccess({ success: true, url: result.download.url });
      } else {
        return sendError("Failed to fetch direct URL.");
      }
    } catch (err) {
      return sendError(err.message);
    }
  });`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts with SSE support for get-youtube-link!");
} else {
  console.log("Regex not found!");
}
