const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Restore type Tab
content = content.replace(
  "type Tab = 'pinterest' | 'youtube' | 'youtube-shorts' | 'instagram' | 'instagram-reels' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin';",
  "type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin';"
);

// 2. Restore TABS
const newTabs = `const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; }[] = [
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', title: 'YouTube Downloader - Video & Audio Saver', description: 'Download YouTube videos and audio in HD quality. The fastest free YouTube video downloader for MP4 and MP3 formats.' },
  { id: 'youtube-shorts', label: 'YT Shorts', placeholder: 'Paste YouTube Shorts Link Here', name: 'YouTube Shorts Downloader', title: 'YouTube Shorts Downloader - Save YT Shorts', description: 'Download YouTube Shorts videos quickly and easily. Save YT shorts directly to your device in high definition MP4 format.' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', title: 'Instagram Downloader - Save Photos & Videos', description: 'Download Instagram videos, photos, stories, IGTV and carousels for free. Fast and secure Instagram media saver.' },
  { id: 'instagram-reels', label: 'IG Reels', placeholder: 'Paste Instagram Reels Link Here', name: 'Instagram Reels Downloader', title: 'Instagram Reels Downloader - Save IG Reels', description: 'Download Instagram Reels videos in high quality. Fast, free, and secure IG Reels saver for your device.' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', title: 'Facebook Video Downloader - Save FB Videos', description: 'Download Facebook videos and reels in high quality. Free and fast FB video saver.' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', title: 'TikTok Downloader - No Watermark Video Saver', description: 'Download TikTok videos without watermark. Fast, free HD TikTok video and MP3 audio downloader.' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', title: 'Pinterest Downloader - Video & Image Saver', description: 'Download high-quality Pinterest images, videos, and GIFs for free. Our fast Pinterest downloader works on all devices without watermarks.' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', title: 'Reddit Video Downloader - Save Videos with Audio', description: 'Download Reddit videos with sound and audio. Save Reddit images, GIFs, and media fast and free.' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'Paste X / Twitter Link Here', name: 'X / Twitter Downloader', title: 'X (Twitter) Video Downloader - Save Tweets', description: 'Download videos and GIFs from X (Twitter). Fast, free, and secure X media saver.' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'LinkedIn Video Downloader - Save LI Videos', description: 'Download LinkedIn videos, images, and documents. Save professional media from LinkedIn posts easily.' },
];`;

const origTabs = `const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; }[] = [
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', title: 'Pinterest Downloader - Video & Image Saver', description: 'Download high-quality Pinterest images, videos, and GIFs for free. Our fast Pinterest downloader works on all devices without watermarks.' },
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', title: 'YouTube Downloader - Video & Audio Saver', description: 'Download YouTube videos and audio in HD quality. The fastest free YouTube video downloader for MP4 and MP3 formats.' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', title: 'Instagram Downloader - Save Photos & Videos', description: 'Download Instagram videos, photos, stories, IGTV and carousels for free. Fast and secure Instagram media saver.' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', title: 'TikTok Downloader - No Watermark Video Saver', description: 'Download TikTok videos without watermark. Fast, free HD TikTok video and MP3 audio downloader.' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', title: 'Facebook Video Downloader - Save FB Videos', description: 'Download Facebook videos and reels in high quality. Free and fast FB video saver.' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', title: 'Reddit Video Downloader - Save Videos with Audio', description: 'Download Reddit videos with sound and audio. Save Reddit images, GIFs, and media fast and free.' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'Paste X / Twitter Link Here', name: 'X / Twitter Downloader', title: 'X (Twitter) Video Downloader - Save Tweets', description: 'Download videos and GIFs from X (Twitter). Fast, free, and secure X media saver.' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'LinkedIn Video Downloader - Save LI Videos', description: 'Download LinkedIn videos, images, and documents. Save professional media from LinkedIn posts easily.' },
];`;

content = content.replace(newTabs, origTabs);

// 3. Restore Routes
const newRoutes = `<Routes>
      <Route path="/" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/youtube-downloader" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/youtube-shorts-downloader" element={<DownloaderView routeTab="youtube-shorts" />} />
      <Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/instagram-reels-downloader" element={<DownloaderView routeTab="instagram-reels" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/pinterest-downloader" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="*" element={<DownloaderView routeTab="youtube" />} />
    </Routes>`;

const origRoutes = `<Routes>
      <Route path="/" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="/youtube-downloader" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/pinterest-downloader" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="*" element={<DownloaderView routeTab="pinterest" />} />
    </Routes>`;

content = content.replace(newRoutes, origRoutes);

// 4. Restore detectPlatformFromUrl
const newDetect = `const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    if (lowercase.includes('/reel/') || lowercase.includes('/reels/')) {
      return 'instagram-reels';
    }
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    if (lowercase.includes('/shorts/')) {
      return 'youtube-shorts';
    }
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  return null;
};`;

const origDetect = `const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  return null;
};`;

content = content.replace(newDetect, origDetect);

fs.writeFileSync('src/App.tsx', content);
