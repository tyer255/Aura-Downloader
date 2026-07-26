const fs = require('fs');

// Patch server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'unknown' = 'unknown';`,
  `let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'snapchat' | 'unknown' = 'unknown';`
);

serverContent = serverContent.replace(
  `  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
    if (url.includes("/in/") || url.includes("/company/")) {
      type = 'profile';
    } else if (url.includes("/posts/")) {
      type = 'media';
    }
  }`,
  `  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
    if (url.includes("/in/") || url.includes("/company/")) {
      type = 'profile';
    } else if (url.includes("/posts/")) {
      type = 'media';
    }
  } else if (url.includes("snapchat.com")) {
    platform = 'snapchat';
    if (!url.includes("/spotlight/") && !url.includes("/s/") && !url.includes("/p/")) {
      type = 'profile';
    }
  }`
);

fs.writeFileSync('server.ts', serverContent);

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(
  `url.includes('linkedin.com') ||`,
  `url.includes('linkedin.com') ||
    url.includes('snapchat.com') ||`
);

appContent = appContent.replace(
  `type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin';`,
  `type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin' | 'snapchat';`
);

appContent = appContent.replace(
  `{ id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver' },`,
  `{ id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver' },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'Paste Snapchat Spotlight or Story Link', name: 'Snapchat Downloader', title: 'Aura Downloader - Download Snapchat Videos Free', description: 'Free online Snapchat Video Downloader. Download Snapchat Spotlight videos and stories in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, Snapchat downloader, download Snapchat video, Snapchat spotlight downloader, story saver' },`
);

appContent = appContent.replace(
  `  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }`,
  `  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (lowercase.includes('snapchat.com')) {
    return 'snapchat';
  }`
);

appContent = appContent.replace(
  `    case 'linkedin':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="url(#linkedin-grad)" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg scale-[1.1] sm:scale-[1.25]">
          <defs>
            <linearGradient id="linkedin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A0DC" />
              <stop offset="100%" stopColor="#0077b5" />
            </linearGradient>
          </defs>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      );`,
  `    case 'linkedin':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="url(#linkedin-grad)" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg scale-[1.1] sm:scale-[1.25]">
          <defs>
            <linearGradient id="linkedin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A0DC" />
              <stop offset="100%" stopColor="#0077b5" />
            </linearGradient>
          </defs>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      );
    case 'snapchat':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="url(#snap-grad)" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg scale-[1.1] sm:scale-[1.25]">
          <defs>
            <linearGradient id="snap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFC00" />
              <stop offset="100%" stopColor="#FFFC00" />
            </linearGradient>
          </defs>
          <path d="M11.954 1.636c.205 0 .399.162.399.162.91.757 1.488 1.955 1.488 3.01v.095c0 .243.082.473.238.648.272.298.665.405 1.05.324.604-.135 1.254-.041 1.76.297.243.162.37.405.37.662 0 .432-.303.824-.805 1.054a3.174 3.174 0 0 0-1.84 2.768c-.01 1.134.61 2.066 1.487 2.376.626.216 1.341.148 1.832-.081.798-.378 1.485.459.733.918-.707.419-1.282 1.054-1.636 1.81l-.039.095c-.37 1.013-1.403 1.62-2.474 1.62-.25 0-.498-.027-.741-.095a5.538 5.538 0 0 1-3.693 3.416 1.334 1.334 0 0 1-1.026.027 5.518 5.518 0 0 1-3.8-3.443 3.327 3.327 0 0 1-.741.095c-1.07 0-2.103-.607-2.473-1.62-.014-.027-.028-.067-.042-.108-.344-.73-.902-1.35-1.584-1.755-.742-.446-.065-1.297.742-.919.49.23 1.205.297 1.831.081.876-.31 1.497-1.242 1.487-2.376a3.176 3.176 0 0 0-1.84-2.768c-.502-.23-.805-.621-.805-1.054 0-.256.126-.5.37-.662.505-.337 1.155-.432 1.76-.297.384.081.777-.026 1.05-.324.155-.175.237-.405.237-.648v-.094c0-1.054.577-2.253 1.487-3.013a2.384 2.384 0 0 1 1.012-.472c.485-.082 1.012-.041 1.455.135h.001Z" fill="#000"/>
        </svg>
      );`
);

appContent = appContent.replace(
  `    case 'linkedin':
      return {
        icon: render3DGlassIcon('linkedin'),
        colorClass: 'text-sky-600',
        bgClass: 'bg-sky-600',
        borderClass: 'border-sky-600'
      };`,
  `    case 'linkedin':
      return {
        icon: render3DGlassIcon('linkedin'),
        colorClass: 'text-sky-600',
        bgClass: 'bg-sky-600',
        borderClass: 'border-sky-600'
      };
    case 'snapchat':
      return {
        icon: render3DGlassIcon('snapchat'),
        colorClass: 'text-yellow-400',
        bgClass: 'bg-yellow-400',
        borderClass: 'border-yellow-400'
      };`
);

appContent = appContent.replace(
  `    linkedin: 88`,
  `    linkedin: 88,
    snapchat: 110`
);

appContent = appContent.replace(
  `      case 'linkedin': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#64748B_0%,#334155_70%,#000000_100%)]';`,
  `      case 'linkedin': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#64748B_0%,#334155_70%,#000000_100%)]';
      case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#EAB308_0%,#A16207_70%,#000000_100%)]';`
);

appContent = appContent.replace(
  `                    case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.15)]';`,
  `                    case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.15)]';
                    case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.15)]';`
);

appContent = appContent.replace(
  `                  case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.4)]';`,
  `                  case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.4)]';
                  case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.4)]';`
);

appContent = appContent.replace(
  `                    case 'linkedin': return 'hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:border-sky-500/40';`,
  `                    case 'linkedin': return 'hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:border-sky-500/40';
                    case 'snapchat': return 'hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] dark:hover:shadow-[0_0_25px_rgba(234,179,8,0.35)] hover:border-yellow-500/40';`
);

appContent = appContent.replace(
  `    case 'linkedin':`,
  `    case 'linkedin':
    case 'snapchat':`
);

appContent = appContent.replace(
  `    case 'linkedin': return '#0077b5';`,
  `    case 'linkedin': return '#0077b5';
    case 'snapchat': return '#FFFC00';`
);

appContent = appContent.replace(
  `      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />`,
  `      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/snapchat-downloader" element={<DownloaderView routeTab="snapchat" />} />`
);

fs.writeFileSync('src/App.tsx', appContent);
console.log("Patched App.tsx and server.ts");
