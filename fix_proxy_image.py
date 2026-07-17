import re

with open('server.ts', 'r') as f:
    content = f.read()

proxy_image_route = """
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).send("Missing url parameter");
    }
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      res.setHeader("Cache-Control", "public, max-age=86400");
      
      if (response.body) {
         response.body.pipe(res);
      } else {
         const buffer = await response.buffer();
         res.send(buffer);
      }
    } catch (error: any) {
      console.error("Proxy image error:", error.message);
      res.status(500).send("Error proxying image");
    }
  });

  app.get("/api/proxy-download", (req, res) => {"""

content = content.replace('  app.get("/api/proxy-download", (req, res) => {', proxy_image_route)

with open('server.ts', 'w') as f:
    f.write(content)

