import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ttdl, youtube } from "btch-downloader";
import https from "https";
import http from "http";
import { URL } from "url";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set secure HTTP headers (omitting X-Frame-Options to remain iframe-compatible with AI Studio)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Helper to validate URLs to protect against Server-Side Request Forgery (SSRF)
  function isSafeUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block loopback / private IP formats and local/cloud metadata systems
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '[::1]' ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')
      ) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Helper for proxying media
  function pipeUrlStream(fileUrl: string, res: express.Response, customFilename?: string, inline?: boolean) {
    const parsedUrl = new URL(fileUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;
    
    const req = client.get(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Referer": parsedUrl.origin
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        // Handle redirect
        const redirectUrl = proxyRes.headers.location.startsWith("http") 
          ? proxyRes.headers.location 
          : new URL(proxyRes.headers.location, parsedUrl.origin).href;
        return pipeUrlStream(redirectUrl, res, customFilename, inline);
      }
      
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        return res.status(proxyRes.statusCode).json({ error: `Upstream error: ${proxyRes.statusCode}` });
      }

      const contentType = proxyRes.headers["content-type"] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      
      if (!inline) {
        let filename = customFilename || "downloaded_file";
        if (!filename.includes(".")) {
          filename += contentType.includes("video") ? ".mp4" : contentType.includes("image") ? ".jpg" : "";
        }
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      } else {
        res.setHeader("Content-Disposition", "inline");
      }
      
      if (proxyRes.headers["content-length"]) {
        res.setHeader("Content-Length", proxyRes.headers["content-length"]);
      }
      
      // Allow CORS for the inline player
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      proxyRes.pipe(res);
    });
    
    req.on("error", (err) => {
      console.error("Proxy error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to fetch remote stream" });
      }
    });
  }

  // API Route for downloading media
  app.post("/api/download", async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    try {
      const lowerUrl = url.toLowerCase();
      
      // TikTok Downloader
      if (lowerUrl.includes("tiktok.com")) {
        const result = await ttdl(url);
        if (result && result.status && result.video && result.video.length > 0) {
          return res.json({
            success: true,
            title: result.title || "TikTok Video",
            mediaFiles: result.video.map((v: string) => ({
              type: "video",
              url: v,
              thumbnail: result.thumbnail
            }))
          });
        }
        return res.status(400).json({ success: false, message: "Failed to parse TikTok video." });
      }
      
      // YouTube Downloader
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        const result = await youtube(url);
        if (result && result.status && result.mp4) {
          return res.json({
            success: true,
            title: result.title || "YouTube Video",
            mediaFiles: [{
              type: "video",
              url: result.mp4,
              thumbnail: result.thumbnail
            }]
          });
        }
        return res.status(400).json({ success: false, message: "Failed to parse YouTube video." });
      }
      
      // Twitter / X (Inform user that it is unsupported right now)
      if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
        return res.status(400).json({ success: false, message: "Twitter/X video downloading is currently blocked by the platform for guest users. Please try YouTube or TikTok." });
      }
      
      // Instagram (Inform user that it is unsupported right now)
      if (lowerUrl.includes("instagram.com")) {
        return res.status(400).json({ success: false, message: "Instagram video downloading is currently blocked by the platform for guest users. Please try YouTube or TikTok." });
      }

      return res.status(400).json({ success: false, message: "Unsupported platform. Currently supporting TikTok and YouTube." });
    } catch (error: any) {
      console.error("API Download Error:", error.message);
      return res.status(500).json({ success: false, message: error.message || "Failed to process the URL." });
    }
  });

  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url as string;
    const customFilename = req.query.filename as string | undefined;
    const inline = req.query.inline === "true";
    
    if (!fileUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    if (!isSafeUrl(fileUrl)) {
      return res.status(400).json({ error: "Invalid or unsafe URL parameter" });
    }
    
    pipeUrlStream(fileUrl, res, customFilename, inline);
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
