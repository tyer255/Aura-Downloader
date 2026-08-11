const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    }
  } catch (e) {}

  return null;
}

async function extractInstagramRepoBackend(url: string) {`;

const replacement = `    }

    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const thumbMatch = html.match(/"display_url":"([^"]+)"/);
    
    if (videoMatch || thumbMatch) {
      const mediaUrl = videoMatch ? videoMatch[1].replace(/\\\\u0026/g, '&') : (thumbMatch ? thumbMatch[1].replace(/\\\\u0026/g, '&') : "");
      const thumbnail = thumbMatch ? thumbMatch[1].replace(/\\\\u0026/g, '&') : mediaUrl;
      const mediaType = videoMatch ? "video" : "image";
      return {
        success: true,
        title: videoMatch ? "Instagram Reel" : "Instagram Post",
        thumbnail,
        url: mediaUrl,
        mediaType,
        media: [{ type: mediaType, url: mediaUrl, thumbnail }],
        source: "embed_regex"
      };
    }

  } catch (e) {}

  return null;
}

async function extractInstagramRepoBackend(url: string) {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched fallback successfully!");
} else {
  console.log("Target not found!");
}
