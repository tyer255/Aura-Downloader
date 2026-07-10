const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const igLogic = `
      // Admin Instagram Private API Extraction
      if (platform === 'instagram' && typeof igClient !== 'undefined' && igClient !== null) {
        console.log("Using Admin Instagram session...");
        try {
          const shortcodeMatch = trimmedUrl.match(/(?:reel|p|tv|reels)\\/([a-zA-Z0-9_-]+)/);
          if (shortcodeMatch && shortcodeMatch[1]) {
            const shortcode = shortcodeMatch[1];
            // manual shortcode to ID
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
            let id = BigInt(0);
            for (let i = 0; i < shortcode.length; i++) {
              id = (id * BigInt(64)) + BigInt(alphabet.indexOf(shortcode[i]));
            }
            const mediaId = id.toString();
            
            const info = await igClient.media.info(mediaId);
            const item = info.items[0];
            
            let mediaList = [];
            
            if (item.carousel_media) {
              for (const m of item.carousel_media) {
                if (m.media_type === 2 && m.video_versions) {
                  mediaList.push({ type: "video", url: m.video_versions[0].url, thumbnail: m.image_versions2?.candidates[0]?.url || "" });
                } else if (m.media_type === 1 && m.image_versions2) {
                  mediaList.push({ type: "image", url: m.image_versions2.candidates[0].url, thumbnail: m.image_versions2.candidates[0].url });
                }
              }
            } else {
               if (item.media_type === 2 && item.video_versions) {
                  mediaList.push({ type: "video", url: item.video_versions[0].url, thumbnail: item.image_versions2?.candidates[0]?.url || "" });
               } else if (item.media_type === 1 && item.image_versions2) {
                  mediaList.push({ type: "image", url: item.image_versions2.candidates[0].url, thumbnail: item.image_versions2.candidates[0].url });
               }
            }
            
            if (mediaList.length > 0) {
              console.log("Extraction via Admin IG Client succeeded!");
              return res.json({
                success: true,
                title: item.caption?.text || "Instagram Media",
                url: mediaList[0].url,
                mediaType: mediaList[0].type,
                qualities: getFallbackQualities(mediaList[0].url, mediaList[0].type),
                media: mediaList,
                thumbnail: mediaList[0].thumbnail
              });
            }
          }
        } catch (e) {
           console.error("Admin IG extraction error:", e.message);
        }
      }
`;

// Insert it before ytDlpResult
code = code.replace(/\/\/ 1\. Primary: yt-dlp_linux/, igLogic + '\n      // 1. Primary: yt-dlp_linux');

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with IG Admin logic.");
