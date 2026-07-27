const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const spotifyIconStr = `const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" />
  </svg>
);`;

const threadsIconStr = `const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.7 10.999a4.808 4.808 0 1 0-1.332 3.197h.047a5.578 5.578 0 0 1-5.074 3.49C6.96 17.686 4 14.821 4 11.954c0-2.88 2.924-5.753 6.34-5.753 3.486 0 5.679 2.228 5.679 5.378v.528h-7.14a2.913 2.913 0 0 0 2.85 2.507 2.973 2.973 0 0 0 2.457-1.445l1.636 1.027a4.908 4.908 0 0 1-4.093 2.378 4.887 4.887 0 0 1-4.832-4.969 4.872 4.872 0 0 1 4.89-4.912 4.755 4.755 0 0 1 4.825 4.544v1.761c0 1.233-.51 2.296-1.572 2.296-.543 0-1.056-.25-1.32-.782a4.417 4.417 0 0 1-.362-.008zm-7.14-1.425h5.18a2.923 2.923 0 0 0-2.584-2.593 2.898 2.898 0 0 0-2.597 2.593zm1.884 1.705a2.802 2.802 0 0 1 2.529-1.705 2.769 2.769 0 0 1 2.748 2.102h.007a2.298 2.298 0 0 0-.012-.224 2.87 2.87 0 0 0-.256-1.12c-.528.847-1.455 1.34-2.486 1.34-1.636 0-2.73-1.058-2.53-2.393z" />
  </svg>
);`;

if (!code.includes('const SpotifyIcon')) {
    code = code.replace("export default function App() {", spotifyIconStr + "\n" + threadsIconStr + "\nexport default function App() {");
}

const targetTabType = `type Tab = 'pinterest' | 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat' | 'spotify';`;
const replaceTabType = `type Tab = 'pinterest' | 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat' | 'spotify' | 'threads';`;
code = code.replace(targetTabType, replaceTabType);

const targetTabs = `  { id: 'snapchat', name: 'Snapchat', label: 'Snapchat Stories', path: '/snapchat-downloader', icon: <Camera className="w-4 h-4" /> },
  { id: 'spotify', name: 'Spotify', label: 'Spotify Audio', path: '/spotify-downloader', icon: <Headphones className="w-4 h-4" /> }
];`;
const replaceTabs = `  { id: 'snapchat', name: 'Snapchat', label: 'Snapchat Stories', path: '/snapchat-downloader', icon: <Camera className="w-4 h-4" /> },
  { id: 'spotify', name: 'Spotify', label: 'Spotify Audio', path: '/spotify-downloader', icon: <SpotifyIcon className="w-4 h-4" /> },
  { id: 'threads', name: 'Threads', label: 'Threads Video', path: '/threads-downloader', icon: <ThreadsIcon className="w-4 h-4" /> }
];`;
code = code.replace(targetTabs, replaceTabs);

const targetRender3D = `    case 'spotify':
      return <div className="absolute inset-0 bg-[#1DB954] opacity-20 blur-xl mix-blend-screen" />;`;
const replaceRender3D = `    case 'spotify':
      return <div className="absolute inset-0 bg-[#1DB954] opacity-20 blur-xl mix-blend-screen" />;
    case 'threads':
      return <div className="absolute inset-0 bg-neutral-900 opacity-20 blur-xl mix-blend-screen" />;`;
code = code.replace(targetRender3D, replaceRender3D);

const targetGetPlatformDetails = `    case 'spotify':
      return { icon: <Headphones className="w-4 h-4" />, colorClass: "text-[#1DB954]", bgClass: "bg-[#1DB954]/10", borderClass: "border-[#1DB954]/20" };`;
const replaceGetPlatformDetails = `    case 'spotify':
      return { icon: <SpotifyIcon className="w-4 h-4" />, colorClass: "text-[#1DB954]", bgClass: "bg-[#1DB954]/10", borderClass: "border-[#1DB954]/20" };
    case 'threads':
      return { icon: <ThreadsIcon className="w-4 h-4" />, colorClass: "text-neutral-900 dark:text-neutral-100", bgClass: "bg-neutral-500/10", borderClass: "border-neutral-500/20" };`;
code = code.replace(targetGetPlatformDetails, replaceGetPlatformDetails);

const targetDetectPlatform = `  if (url.includes('spotify.com')) return 'spotify';`;
const replaceDetectPlatform = `  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('threads.net')) return 'threads';`;
code = code.replace(targetDetectPlatform, replaceDetectPlatform);

const targetPings = `          spotify: 10,`;
const replacePings = `          spotify: 10,
          threads: 60,`;
code = code.replace(targetPings, replacePings);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with Custom Logos and Threads correctly");
