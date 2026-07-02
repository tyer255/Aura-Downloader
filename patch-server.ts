import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url as string;
    const customFilename = req.query.filename as string || "download";
    const inline = req.query.inline === "true";

    if (!fileUrl) {
      return res.status(400).send("URL query parameter is required");
    }

    console.log(\`Initiating stream proxy download for: \${fileUrl} (inline=\${inline})\`);
    pipeUrlStream(fileUrl, res, customFilename, inline);
  });`;

const replacementStr = `  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url as string;
    const customFilename = req.query.filename as string || "download";
    const inline = req.query.inline === "true";

    if (!fileUrl) {
      return res.status(400).send("URL query parameter is required");
    }

    // Bypass proxy for Cobalt tunnel URLs to avoid Cloudflare bot blocking
    // Cobalt tunnels have CORS and Content-Disposition headers natively.
    if (fileUrl.includes("/tunnel?id=")) {
      console.log(\`Redirecting Cobalt tunnel URL to avoid proxy block: \${fileUrl}\`);
      return res.redirect(fileUrl);
    }

    console.log(\`Initiating stream proxy download for: \${fileUrl} (inline=\${inline})\`);
    pipeUrlStream(fileUrl, res, customFilename, inline);
  });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts successfully!");
} else {
  console.log("Could not find target string.");
}
