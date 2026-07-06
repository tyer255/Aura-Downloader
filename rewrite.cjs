const fs = require('fs');
let code = fs.readFileSync('oldFunc.txt', 'utf8');

// 1. Move imports to top, remove child_process/util imports that are mid-file
code = code.replace(/import \{ exec \} from 'child_process';/g, '');
code = code.replace(/import utilSync from 'util';/g, '');
code = "import { exec } from 'child_process';\nimport utilSync from 'util';\n" + code;

// 2. Fix the unbalanced if statement in Cheerio fallback
code = code.replace(/if \(!directUrl && !isProfile\) \{\s*const mediaType =/g, 'const mediaType =');

// 3. Remove the broken cobalt return at the end of the file.
// The file ends with:
//   } catch (err: any) {
//     console.error(`Url parsing error in pipeUrlStream: ${err.message}`);
//     if (!res.headersSent) {
//       res.redirect(fileUrl);
//     }
//   }
// }
// return { success: false, error: "All public Cobalt endpoints failed. Please wait or try another tool." };
// }
const lastReturnIndex = code.lastIndexOf('return { success: false');
if (lastReturnIndex !== -1) {
    code = code.substring(0, lastReturnIndex);
}

// 4. Append startServer and Express setup
const expressApp = `
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.post("/api/download", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    try {
      const trimmedUrl = url.trim();
      const lowerUrl = trimmedUrl.toLowerCase();
      const { platform, type } = classifyUrl(trimmedUrl);
      const isProfile = type === 'profile';
      console.log(\`Processing extraction for platform: \${platform}, type: \${type}, url: \${trimmedUrl}\`);

      // 1. Primary: yt-dlp_linux
      const ytDlpResult = await extractWithYtDlp(trimmedUrl);
      if (ytDlpResult && ytDlpResult.success) {
        console.log("Extraction via yt-dlp succeeded!");
        return res.json(ytDlpResult);
      }

      // 2. Fallbacks for specific platforms
      if (lowerUrl.includes("tiktok.com")) {
        try {
          const result = await btch.ttdl(trimmedUrl);
          if (result && result.status && result.video && result.video.length > 0) {
            const videoUrl = result.video[0];
            return res.json({
              success: true,
              title: result.title || "TikTok Video",
              thumbnail: result.thumbnail,
              url: videoUrl,
              mediaType: "video",
              qualities: getFallbackQualities(videoUrl, "video"),
              media: [{ type: "video", url: videoUrl, thumbnail: result.thumbnail }]
            });
          }
        } catch (e) {
          console.error("TikTok fallback scraper failed:", e.message);
        }
      }
      
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        try {
          const result = await btch.youtube(trimmedUrl);
          if (result && result.status && result.mp4) {
            return res.json({
              success: true,
              title: result.title || "YouTube Video",
              thumbnail: result.thumbnail,
              url: result.mp4,
              mediaType: "video",
              qualities: getFallbackQualities(result.mp4, "video"),
              media: [{ type: "video", url: result.mp4, thumbnail: result.thumbnail }]
            });
          }
        } catch (e) {
          console.error("YouTube fallback scraper failed:", e.message);
        }
      }

      // 3. AI / Cheerio fallback
      console.log("No specialized or yt-dlp scraper succeeded. Running last-resort AI/Cheerio fallback...");
      const aiResult = await extractWithAI(trimmedUrl, isProfile);
      if (aiResult && aiResult.success) {
        console.log("Last-resort extraction succeeded!");
        return res.json(aiResult);
      }

      return res.status(400).json({ 
         success: false, 
         message: "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again." 
       });
          
    } catch (error) {
      console.error("API Download Exception:", error.message);
      return res.status(500).json({ success: false, message: error.message || "An unexpected error occurred while processing the URL." });
    }
  });

  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url;
    const customFilename = req.query.filename;
    const inline = req.query.inline === "true";
    if (!fileUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    pipeUrlStream(fileUrl, res, customFilename, inline);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;
code += expressApp;

// Fix `extractWithYtDlp` to use `yt-dlp_linux`
code = code.replace(/execAsync\([\s\S]*?yt-dlp .*?\)/g, 'execAsync(`./yt-dlp_linux --js-runtimes node --no-playlist --dump-json "${url}"`, { timeout: 25000 })');

fs.writeFileSync('server.ts', code);
console.log("Rewritten!");
