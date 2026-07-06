const fs = require('fs');

let serverFile = fs.readFileSync('server.ts', 'utf-8');

const newClassifyUrl = `function classifyUrl(urlStr: string) {
  const url = urlStr.toLowerCase().trim();
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'unknown' = 'unknown';
  let type: 'profile' | 'community_post' | 'media' = 'media';

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    platform = 'youtube';
    if (url.includes("/channel/") || url.includes("/c/") || url.includes("/@") || url.includes("/community") || url.includes("/post/")) {
      if (url.includes("/post/") || url.includes("lb=")) {
        type = 'community_post';
      } else {
        type = 'profile';
      }
    }
  } else if (url.includes("instagram.com")) {
    platform = 'instagram';
    if (!url.includes("/p/") && !url.includes("/reel/") && !url.includes("/tv/") && !url.includes("/stories/")) {
      const path = urlStr.split("instagram.com")[1] || "";
      const segments = path.split("?")[0].split("/").filter(Boolean);
      if (segments.length === 1) {
        type = 'profile';
      }
    }
  } else if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
    platform = 'facebook';
    if (url.includes("/profile.php") || url.includes("/people/") || (!url.includes("/videos/") && !url.includes("/reel/") && !url.includes("/watch") && !url.includes("/posts/") && !url.includes("/photo.php"))) {
      const path = urlStr.split(/facebook\\.com|fb\\.com/)[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("tiktok.com")) {
    platform = 'tiktok';
    if (!url.includes("/video/")) {
      const path = urlStr.split("tiktok.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1 && segments[0].startsWith("@")) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("whatsapp.com") || url.includes("wa.me")) {
    platform = 'unknown'; // handle via AI/yt-dlp
  } else if (url.includes("reddit.com") || url.includes("redd.it")) {
    platform = 'reddit';
    if (url.includes("/user/") || url.includes("/u/")) {
      type = 'profile';
    }
  } else if (url.includes("pinterest.com") || url.includes("pin.it")) {
    platform = 'pinterest';
    if (!url.includes("/pin/") && !url.includes("pin.it")) {
      const path = urlStr.split("pinterest.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("x.com") || url.includes("twitter.com")) {
    platform = 'x';
    if (!url.includes("/status/")) {
      const path = urlStr.split(/x\\.com|twitter\\.com/)[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
    if (url.includes("/in/") || url.includes("/company/")) {
      type = 'profile';
    } else if (url.includes("/posts/")) {
      type = 'community_post';
    }
  }
  return { platform, type };
}
`;

serverFile = serverFile.replace(/function classifyUrl[\s\S]*?return \{ platform, type \};\n\}/, newClassifyUrl);
fs.writeFileSync('server.ts', serverFile);
console.log("Updated classifyUrl");
