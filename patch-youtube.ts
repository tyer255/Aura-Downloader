import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
const youtubeStart = content.indexOf(`if (classification.platform === 'youtube') {`);
const youtubeEnd = content.indexOf(`if (classification.platform !== 'youtube') {`, youtubeStart);

const newYoutubeBlock = `if (classification.platform === 'youtube') {
        try {
          console.log("Primary YouTube extraction using @vreden/youtube_scraper...");
          let resData: any = null;
          for (let qual of ['1080p', '720p', '480p', '360p']) {
             try {
                const temp = await vredenYtmp4(url, qual);
                if (temp && temp.status && temp.download && temp.download.url) {
                   resData = temp;
                   break;
                }
             } catch(e) {}
          }
          if (resData && resData.download && resData.download.url) {
             return res.json({
                success: true,
                url: resData.download.url,
                title: resData.metadata?.title || "YouTube Video",
                thumbnail: resData.metadata?.thumbnail || resData.metadata?.image,
                mediaType: "video",
                source: "vreden-ytmp4"
             });
          }
        } catch (ytVredenErr: any) {
          console.log("Primary vreden extraction failed:", ytVredenErr.message);
        }

        try {
          console.log("Secondary YouTube extraction using btch-downloader...");
          const btchRes = await btch.youtube(url);
          if (btchRes && btchRes.status && btchRes.mp4) {
             return res.json({
                success: true,
                url: btchRes.mp4,
                title: btchRes.title || "YouTube Video",
                thumbnail: btchRes.thumbnail,
                mediaType: "video",
                source: "btch-youtube"
             });
          }
        } catch (btchErr: any) {
          console.log("Secondary btch extraction failed:", btchErr.message);
        }
      }

      // ========================================================
      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
      // ========================================================
      `;

content = content.substring(0, youtubeStart) + newYoutubeBlock + content.substring(youtubeEnd + `// ========================================================\n      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)\n      // ========================================================\n      `.length);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts successfully");
