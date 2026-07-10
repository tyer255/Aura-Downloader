const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Insert btch.igdl fallback
const fallbackPoint = `      // 3. Fallbacks for specific platforms`;
const replacement = `      // Instagram fallback
      if (platform === 'instagram') {
        try {
          console.log("Trying btch.igdl...");
          const igResult = await btch.igdl(trimmedUrl);
          if (igResult && igResult.status && igResult.result && igResult.result.length > 0) {
            const mediaList = [];
            for (const item of igResult.result) {
              if (item.url) {
                // Determine if it's a video based on url extension if possible
                const isVideo = item.url.includes('.mp4') || (item.thumbnail && item.thumbnail.length > 0);
                mediaList.push({
                   type: isVideo ? "video" : "image",
                   url: item.url,
                   thumbnail: item.thumbnail || ""
                });
              }
            }
            if (mediaList.length > 0) {
              console.log("Extraction via btch.igdl succeeded!");
              return res.json({
                success: true,
                title: "Instagram Media",
                url: mediaList[0].url,
                mediaType: mediaList[0].type,
                qualities: getFallbackQualities(mediaList[0].url, mediaList[0].type),
                media: mediaList,
                thumbnail: mediaList[0].thumbnail || mediaList[0].url
              });
            }
          }
        } catch (e) {
          console.log("btch.igdl error:", e.message);
        }
      }

      // 3. Fallbacks for specific platforms`;

code = code.replace(fallbackPoint, replacement);

fs.writeFileSync('server.ts', code);
