const fs = require('fs');

let serverFile = fs.readFileSync('server.ts', 'utf-8');

// 1. Update classifyUrl
const oldClassifyUrl = `function classifyUrl(urlStr: string) {
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
    // Check if it is a profile
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
      const path = urlStr.split("facebook.com")[1] || "";
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
  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
  }
  return { platform, type };
}`;

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
      const path = urlStr.split(/facebook\.com|fb\.com/)[1] || "";
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
      const path = urlStr.split(/x\.com|twitter\.com/)[1] || "";
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
}`;

if (serverFile.includes(oldClassifyUrl)) {
  serverFile = serverFile.replace(oldClassifyUrl, newClassifyUrl);
  console.log("Replaced classifyUrl");
} else {
  console.log("Could not find old classifyUrl");
}

// 2. Update post("/api/download") to bypass for profiles
const oldDownloadHandlerTop = `
      // 1. Primary: yt-dlp_linux
      const ytDlpResult = await extractWithYtDlp(trimmedUrl);
`;

const newDownloadHandlerTop = `
      if (isProfile) {
        console.log("Profile URL detected, bypassing media extractors and using AI extraction directly.");
        const aiResult = await extractWithAI(trimmedUrl, true);
        if (aiResult && aiResult.success) {
          return res.json(aiResult);
        } else {
           // fallback to other extractors if AI profile extraction fails completely
        }
      }

      // 1. Primary: yt-dlp_linux
      const ytDlpResult = await extractWithYtDlp(trimmedUrl);
`;

if (serverFile.includes(oldDownloadHandlerTop)) {
  serverFile = serverFile.replace(oldDownloadHandlerTop, newDownloadHandlerTop);
  console.log("Replaced download handler logic");
} else {
  console.log("Could not find old download handler top");
}

fs.writeFileSync('server.ts', serverFile);
