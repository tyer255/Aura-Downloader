const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const target = `async function extractWithGalleryDl(url: string) {`;

const replace = `async function extractWithPinterestDl(url: string) {
  try {
    const { stdout } = await execAsync(\`pinterest-dl scrape "\${url}" --json\`, { timeout: 25000, maxBuffer: 1024 * 1024 * 10 });
    if (!stdout) return null;
    let parsed;
    try {
        const jsonMatch = stdout.match(/\{[\\s\\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            return null;
        }
    } catch(e) {
        return null;
    }
    
    if (!parsed || !parsed.results || parsed.results.length === 0) return null;
    
    const media: any[] = [];
    let title = "Pinterest Media";
    let uploader = "";
    let avatarUrl = "";
    
    const result = parsed.results[0];
    if (result && result.items && result.items.length > 0) {
        for (const item of result.items) {
            if (item.alt) title = item.alt;
            let foundMedia = false;
            if (item.media_stream && item.media_stream.video && item.media_stream.video.url) {
                media.push({ type: "video", url: item.media_stream.video.url, thumbnail: item.src || "" });
                foundMedia = true;
            } else if (item.src) {
                media.push({ type: "image", url: item.src, thumbnail: item.src });
                foundMedia = true;
            }
        }
        
        if (media.length > 0) {
            return {
              success: true,
              url,
              title: title || "Pinterest Download",
              thumbnail: media[0].thumbnail,
              profile: {
                username: uploader,
                avatarUrl: avatarUrl
              },
              media,
              source: "pinterest-dl"
            };
        }
    }
    
    return { success: false, message: "No media found in pin" };
  } catch (err) {
    console.log('pinterest-dl execution error:', err);
  }
  return null;
}

async function extractWithGalleryDl(url: string) {`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('/app/applet/server.ts', code);
    console.log("Added extractWithPinterestDl successfully!");
} else {
    console.log("Target not found!");
}
