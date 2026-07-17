import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace getInstagramShortcode
old_shortcode = """function getInstagramShortcode(url: string): string | null {
  try {
    const cleaned = url.split("?")[0].split("#")[0];
    const parts = cleaned.split("/").filter(Boolean);
    const index = parts.findIndex(p => p === "p" || p === "reel" || p === "tv" || p === "reels");
    if (index !== -1 && parts[index + 1]) {
      return parts[index + 1];
    }
    const match = url.match(/(?:\\/p\\/|\\/reel\\/|\\/tv\\/|\\/reels\\/)([a-zA-Z0-9_-]{11,15})/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}"""
new_shortcode = """function getInstagramShortcode(url: string): string | null {
  const m = url.match(/(?:\\/p|\\/reel|\\/tv|\\/reels)\\/([a-zA-Z0-9_-]{11,15})/);
  return m ? m[1] : null;
}"""

if "function getInstagramShortcode" in content:
    content = re.sub(r'function getInstagramShortcode\(url: string\): string \| null \{[\s\S]*?\n\}', new_shortcode, content)

# Fix btch response and fallback response
old_btch = """      return {
        success: true,
        data: {
          title: "Instagram Post",
          thumbnail: primary.thumbnail,
          url: primary.url,
          mediaType: primary.type,
          media,
          qualities
        }
      };"""
new_btch = """      return {
        success: true,
        data: {
          title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: primary.thumbnail,
          url: primary.url,
          mediaType: primary.type,
          media,
          qualities
        }
      };"""
content = content.replace(old_btch, new_btch)

old_fallback = """      return {
        success: true,
        data: {
          title: "Instagram Post",
          thumbnail: thumbUrl,
          url: mediaUrl,
          mediaType: type,
          qualities
        }
      };"""
new_fallback = """      return {
        success: true,
        data: {
          title: type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: thumbUrl,
          url: mediaUrl,
          mediaType: type,
          media: [{ type, url: mediaUrl, thumbnail: thumbUrl }],
          qualities
        }
      };"""
content = content.replace(old_fallback, new_fallback)

# Ensure fallback doesn't fall through to other extractors if it's an Instagram URL
# Find the download API block
# if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
#    const btchResult = await extractInstagramBtch(trimmedUrl);
#    if (btchResult && btchResult.success) {
#        return res.json(btchResult);
#    }
# }
old_route = """        if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
           const btchResult = await extractInstagramBtch(trimmedUrl);
           if (btchResult && btchResult.success) {
               return res.json(btchResult);
           }
        } else if (platform === 'youtube') {"""
new_route = """        if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
           const btchResult = await extractInstagramBtch(trimmedUrl);
           if (btchResult && btchResult.success) {
               return res.json(btchResult);
           }
           return res.status(400).json({ success: false, message: "Could not extract Instagram URL." });
        } else if (platform === 'youtube') {"""
content = content.replace(old_route, new_route)

with open('server.ts', 'w') as f:
    f.write(content)

