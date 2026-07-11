import re

with open("server.ts", "r") as f:
    content = f.read()

target = '''    if (isPlaylist && data.entries) {
      const validEntries = data.entries.filter((e: any) => e && e.url && e.id);
      const media = validEntries.map((entry: any) => ({
        type: "video",
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        thumbnail: entry.thumbnails?.[0]?.url || (entry.id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : ""),
        title: entry.title || "YouTube Video"
      }));
      return {
        success: true,
        title: data.title || "YouTube Playlist",
        url: media[0]?.url,
        mediaType: "playlist",
        media: media,
        isPlaylist: true
      };
    }'''

replacement = '''    if (isPlaylist && data.entries) {
      const validEntries = data.entries.filter((e: any) => e && e.url && e.id);
      const media = validEntries.map((entry: any) => ({
        type: "video",
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        thumbnail: entry.thumbnails?.[0]?.url || (entry.id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : ""),
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
    }'''

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
