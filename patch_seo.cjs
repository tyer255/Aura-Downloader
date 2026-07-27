const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetSeo = `{ id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver' },
];`;
const replaceSeo = `{ id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver' },
  { id: 'spotify', label: 'Spotify', placeholder: 'Paste Spotify Track or Playlist Link', name: 'Spotify Downloader', title: 'Aura Downloader - Download Spotify Audio Free', description: 'Free online Spotify Audio Downloader. Download Spotify tracks and playlists in MP3 format with Aura Downloader.', keywords: 'Aura Downloader, Spotify downloader, download Spotify audio, Spotify to mp3' },
  { id: 'threads', label: 'Threads', placeholder: 'Paste Threads Video Link Here', name: 'Threads Downloader', title: 'Aura Downloader - Download Threads Videos Free', description: 'Free online Threads Video Downloader. Download Threads videos in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, Threads downloader, download Threads video' },
];`;

if (!code.includes("Spotify Downloader")) {
  code = code.replace(targetSeo, replaceSeo);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched SEO in App.tsx");
} else {
  console.log("Already patched SEO");
}
