import re

with open("server.ts", "r") as f:
    content = f.read()

target = """        // Merge with Cheerio fallback to correct any hallucinated hashes by AI
        try {
            const localData = localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
            if (isProfile && localData && localData.success && localData.profile) {"""

replacement = """        // Merge with Cheerio fallback to correct any hallucinated hashes by AI
        try {
            let localData = localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
            
            // ======= RAPID API INTEGRATION =======
            if (isProfile) {
                const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
                if (rapidKey) {
                    try {
                        if (url.includes("instagram.com")) {
                            console.log("Using RapidAPI for Instagram Profile");
                            const igHost = process.env.RAPIDAPI_IG_HOST || "instagram-scraper-api2.p.rapidapi.com";
                            const cleanUsername = (localData.profile?.username?.replace("@", "")) || url.split("instagram.com/")[1].split("/")[0].split("?")[0];
                            const igRes = await axios.get(`https://${igHost}/v1/info?username_or_id_or_url=${cleanUsername}`, {
                                headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': igHost },
                                timeout: 8000
                            });
                            const rpdata = igRes.data?.data;
                            if (rpdata && rpdata.profile_pic_url_hd) {
                                if (!localData.profile) localData.profile = {};
                                localData.profile.displayName = rpdata.full_name || localData.profile.displayName;
                                localData.profile.avatarUrl = rpdata.profile_pic_url_hd || rpdata.profile_pic_url;
                                localData.profile.bio = rpdata.biography || localData.profile.bio;
                                localData.profile.followers = rpdata.edge_followed_by?.count?.toString() || localData.profile.followers;
                            }
                        } 
                        else if (url.includes("youtube.com") || url.includes("youtu.be")) {
                            console.log("Using RapidAPI for YouTube Profile");
                            const ytHost = process.env.RAPIDAPI_YT_HOST || "yt-api.p.rapidapi.com";
                            const cleanUsername = (localData.profile?.username?.replace("@", "")) || "";
                            const ytRes = await axios.get(`https://${ytHost}/channel/about?id=@${cleanUsername}`, {
                                headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': ytHost },
                                timeout: 8000
                            });
                            if (ytRes.data) {
                                const rpdata = ytRes.data;
                                if (!localData.profile) localData.profile = {};
                                if (rpdata.avatar && rpdata.avatar.length > 0) localData.profile.avatarUrl = rpdata.avatar[rpdata.avatar.length - 1].url;
                                if (rpdata.banner && rpdata.banner.length > 0) localData.profile.bannerUrl = rpdata.banner[rpdata.banner.length - 1].url;
                                localData.profile.displayName = rpdata.title || localData.profile.displayName;
                                localData.profile.bio = rpdata.description || localData.profile.bio;
                                localData.profile.followers = rpdata.subscriberCountText || localData.profile.followers;
                            }
                        }
                    } catch (e: any) {
                        console.error("Rapid API Error:", e.response?.data || e.message);
                    }
                }
            }
            // =====================================

            if (isProfile && localData && localData.success && localData.profile) {"""

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target block not found")
