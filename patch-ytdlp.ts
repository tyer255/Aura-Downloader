import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const newYtDlpFunc = `
async function extractWithYtDlp(url: string, isPlaylist: boolean = false) {
  try {
    const youtubedl = (await import('youtube-dl-exec')).default;
    
    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist
    };
    
    if (isPlaylist) {
       options.flatPlaylist = true;
       options.playlistEnd = 15;
    }
    
    const data: any = await youtubedl(url, options);

    if (isPlaylist && data.entries) {
      const validEntries = data.entries.filter((e: any) => e && e.url && e.id);
      const media = validEntries.map((entry: any) => ({
        type: "video",
        url: entry.url || \`https://www.youtube.com/watch?v=\${entry.id}\`,
        thumbnail: entry.thumbnails?.[0]?.url || (entry.id ? \`https://i.ytimg.com/vi/\${entry.id}/hqdefault.jpg\` : ""),
        title: entry.title || "YouTube Video"
      }));

      const isChannel = url.includes('@') || url.includes('/channel/') || url.includes('/c/');
      if (isChannel) {
        let avatarUrl = "";
        let bannerUrl = "";
        if (data.thumbnails) {
          const avatars = data.thumbnails.filter((t: any) => t.id && t.id.includes('avatar'));
          const banners = data.thumbnails.filter((t: any) => t.id && t.id.includes('banner'));
          if (avatars.length) avatarUrl = avatars[0].url;
          if (banners.length) bannerUrl = banners[0].url;
          
          if (!avatarUrl && data.thumbnails.length > 0) {
              avatarUrl = data.thumbnails[data.thumbnails.length - 1].url;
          }
        }

        // ======= RAPID API INTEGRATION =======
        const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
        if (rapidKey && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            try {
                console.log("Using RapidAPI to enhance YouTube Profile in yt-dlp");
                const ytHost = process.env.RAPIDAPI_YT_HOST || "yt-api.p.rapidapi.com";
                let cleanUsername = url.split("@")[1]?.split("/")[0]?.split("?")[0] || data.uploader_id || "";
                if (cleanUsername) {
                    const ytRes = await (await import('axios')).default.get(\`https://\${ytHost}/channel/about?id=@\${cleanUsername}\`, {
                        headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': ytHost },
                        timeout: 8000
                    });
                    if (ytRes.data) {
                        const rpdata = ytRes.data;
                        if (rpdata.avatar && rpdata.avatar.length > 0) avatarUrl = rpdata.avatar[rpdata.avatar.length - 1].url;
                        if (rpdata.banner && rpdata.banner.length > 0) bannerUrl = rpdata.banner[rpdata.banner.length - 1].url;
                        if (rpdata.title) data.uploader = rpdata.title;
                        if (rpdata.description) data.description = rpdata.description;
                        if (rpdata.subscriberCountText) data.channel_follower_count = rpdata.subscriberCountText;
                    }
                }
            } catch (e: any) {
                console.error("Rapid API Error in yt-dlp:", e.response?.data || e.message);
            }
        }
        // =====================================
        
        return {
          success: true,
          title: data.title || data.uploader || "YouTube Channel",
          mediaType: "profile",
          profile: {
             username: data.uploader_id || data.uploader || "user",
             displayName: data.uploader || data.title || "YouTube Channel",
             avatarUrl: avatarUrl,
             bannerUrl: bannerUrl,
             bio: data.description || "",
             followers: data.channel_follower_count ? data.channel_follower_count.toString() : ""
          },
          media: media,
          isPlaylist: true
        };
      }

      return {
        success: true,
        title: data.title || "YouTube Playlist",
        url: media[0]?.url,
        mediaType: "playlist",
        media: media,
        isPlaylist: true
      };
    }
    
    let qualities = [];
    let mediaUrl = data.url;
    
    if (data.formats && data.formats.length > 0) {
      // Find the best audio format
      const audioFormats = data.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none');
      const bestAudio = audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

      // Video formats
      const videoFormats = data.formats.filter((f: any) => f.vcodec !== 'none');
      
      const heights = new Map();
      videoFormats.forEach((f: any) => {
        if (!f.height) return;
        const current = heights.get(f.height);
        
        // Prefer formats with audio
        if (!current || (current.acodec === 'none' && f.acodec !== 'none')) {
           heights.set(f.height, f);
        }
      });
      
      // Sort heights descending
      const sortedHeights = Array.from(heights.keys()).sort((a, b) => b - a);
      
      sortedHeights.forEach((h: number) => {
         const f = heights.get(h);
         let qUrl = f.url;
         
         // If video has no audio, proxy it to mux with best audio
         if (f.acodec === 'none' && bestAudio) {
            qUrl = \`/api/proxy-download?url=\${encodeURIComponent(f.url)}&audioUrl=\${encodeURIComponent(bestAudio.url)}&mux=true&filename=video_\${h}p.mp4\`;
         }
         
         qualities.push({
            label: \`\${h}p\`,
            url: qUrl,
            ext: "mp4",
            size: \`~ \${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)} MB\`
         });
      });
      
      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // Best quality
      } else {
         // Fallback to finding standard formats
         const formatList = data.formats;
         const best = formatList.find((f: any) => f.format_id === '22' || f.format_id === '18') || formatList[formatList.length - 1];
         if (best) mediaUrl = best.url;
      }
    }

    if (!mediaUrl && data.url) {
        mediaUrl = data.url;
    }

    return {
      success: true,
      title: data.title || "Extracted Video",
      url: mediaUrl,
      thumbnail: data.thumbnail || "",
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities.length > 0 ? qualities : getFallbackQualities(mediaUrl, "video")
    };
  } catch(e: any) {
    // yt-dlp extraction was not successful
    return null;
  }
}
`;

content = content.replace(/async function extractWithYtDlp\([\s\S]*?\n\}\n/m, newYtDlpFunc);
fs.writeFileSync('server.ts', content);
console.log("Patched extractWithYtDlp");
