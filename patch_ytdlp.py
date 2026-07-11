import re

with open("server.ts", "r") as f:
    content = f.read()

target = """          if (!avatarUrl && data.thumbnails.length > 0) {
              avatarUrl = data.thumbnails[data.thumbnails.length - 1].url;
          }
        }"""

replacement = """          if (!avatarUrl && data.thumbnails.length > 0) {
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
                    const ytRes = await axios.get(`https://${ytHost}/channel/about?id=@${cleanUsername}`, {
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
        // ====================================="""

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Patched yt-dlp profile successfully")
else:
    print("Target block not found in yt-dlp")
