import re

with open("server.ts", "r") as f:
    content = f.read()

# We want to replace the `if (isProfile) {` block up to `} else {`
# We can use regex or just string splitting.
# It starts at `    if (isProfile) {` and ends before `    } else {`
# Let's find exactly `    if (isProfile) {`

target_start = """    if (isProfile) {"""
target_end = """    } else {
      return {"""

start_idx = content.find(target_start)
end_idx = content.find(target_end, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find the target block")
    exit(1)

old_block = content[start_idx:end_idx]

new_block = """    if (isProfile) {
      let username = "user";
      if (url.includes("@")) {
        username = "@" + url.split("@")[1].split("/")[0].split("?")[0];
      } else {
        const segments = url.split("/").filter(Boolean);
        username = segments[segments.length - 1] || "user";
      }

      let displayName = (title && title !== "Social Media Post" && !title.includes("404") && !title.includes("Not Found")) ? title.split(" (")[0] : username;
      let avatarUrl = thumbnail || "";
      let bio = description || "";
      let followers = "Unknown";
      let bannerUrl = "";

      // ======= RAPID API INTEGRATION =======
      const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
      if (rapidKey) {
        try {
          if (url.includes("instagram.com")) {
            console.log("Using RapidAPI for Instagram Profile");
            const igHost = process.env.RAPIDAPI_IG_HOST || "instagram-scraper-api2.p.rapidapi.com";
            const cleanUsername = username.replace("@", "");
            
            // Example for instagram-scraper-api2
            const igRes = await axios.get(`https://${igHost}/v1/info?username_or_id_or_url=${cleanUsername}`, {
              headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': igHost
              },
              timeout: 8000
            });
            
            const data = igRes.data?.data;
            if (data && data.profile_pic_url_hd) {
              displayName = data.full_name || displayName;
              avatarUrl = data.profile_pic_url_hd || data.profile_pic_url;
              bio = data.biography || bio;
              followers = data.edge_followed_by?.count?.toString() || followers;
            }
          } 
          else if (url.includes("youtube.com") || url.includes("youtu.be")) {
            console.log("Using RapidAPI for YouTube Profile");
            const ytHost = process.env.RAPIDAPI_YT_HOST || "yt-api.p.rapidapi.com";
            // Example for yt-api
            const cleanUsername = username.replace("@", "");
            const ytRes = await axios.get(`https://${ytHost}/channel/about?id=@${cleanUsername}`, {
              headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': ytHost
              },
              timeout: 8000
            });
            
            if (ytRes.data) {
              const data = ytRes.data;
              if (data.avatar && data.avatar.length > 0) {
                // Get highest res avatar
                avatarUrl = data.avatar[data.avatar.length - 1].url;
              }
              if (data.banner && data.banner.length > 0) {
                // Get highest res banner
                bannerUrl = data.banner[data.banner.length - 1].url;
              }
              displayName = data.title || displayName;
              bio = data.description || bio;
              followers = data.subscriberCountText || followers;
            }
          }
        } catch (e: any) {
          console.error("Rapid API Error:", e.response?.data || e.message);
          // Silently fallback to cheerio scraping below if RapidAPI fails
        }
      }
      // =====================================

      if (!bannerUrl && (url.includes("youtube.com") || url.includes("youtu.be"))) {
        // Try to find followers in YouTube HTML JSON as fallback
        const subMatch = html.match(/\{\"content\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"\}/i);
        if (subMatch) {
            followers = subMatch[1];
        } else {
            const subMatch2 = html.match(/\"simpleText\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"/i);
            if (subMatch2) {
                followers = subMatch2[1];
            }
        }

        // Try to find YouTube banner URL
        const bannerMatch = html.match(/\"banner\":\{.*?\"url\":\"(https:\/\/[^\"]+)\"/);
        if (bannerMatch && bannerMatch[1]) {
            bannerUrl = bannerMatch[1];
        }
      }

      return {
        success: true,
        title: displayName,
        description: bio,
        thumbnail: avatarUrl,
        mediaType: "profile",
        profile: {
          username,
          displayName,
          avatarUrl,
          bannerUrl,
          bio,
          followers,
          following: "Unknown",
          postsCount: "Unknown"
        }
      };
"""

content = content.replace(old_block, new_block)

with open("server.ts", "w") as f:
    f.write(content)
print("Patched successfully")
