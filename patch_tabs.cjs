const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetTabType = `type Tab = 'pinterest' | 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat';`;
const replaceTabType = `type Tab = 'pinterest' | 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat' | 'spotify';`;
code = code.replace(targetTabType, replaceTabType);

const targetTabs = `  { id: 'snapchat', name: 'Snapchat', label: 'Snapchat Stories', path: '/snapchat-downloader', icon: <Camera className="w-4 h-4" /> }
];`;
const replaceTabs = `  { id: 'snapchat', name: 'Snapchat', label: 'Snapchat Stories', path: '/snapchat-downloader', icon: <Camera className="w-4 h-4" /> },
  { id: 'spotify', name: 'Spotify', label: 'Spotify Audio', path: '/spotify-downloader', icon: <Headphones className="w-4 h-4" /> }
];`;
code = code.replace(targetTabs, replaceTabs);

const targetRender3D = `      return <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-xl mix-blend-screen" />;`;
const replaceRender3D = `      return <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-xl mix-blend-screen" />;
    case 'spotify':
      return <div className="absolute inset-0 bg-[#1DB954] opacity-20 blur-xl mix-blend-screen" />;`;
code = code.replace(targetRender3D, replaceRender3D);

const targetGetPlatformDetails = `      return { icon: <Camera className="w-4 h-4" />, colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-500/20" };`;
const replaceGetPlatformDetails = `      return { icon: <Camera className="w-4 h-4" />, colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-500/20" };
    case 'spotify':
      return { icon: <Headphones className="w-4 h-4" />, colorClass: "text-[#1DB954]", bgClass: "bg-[#1DB954]/10", borderClass: "border-[#1DB954]/20" };`;
code = code.replace(targetGetPlatformDetails, replaceGetPlatformDetails);

const targetDetectPlatform = `  if (url.includes('snapchat.com')) return 'snapchat';`;
const replaceDetectPlatform = `  if (url.includes('snapchat.com')) return 'snapchat';
  if (url.includes('spotify.com')) return 'spotify';`;
code = code.replace(targetDetectPlatform, replaceDetectPlatform);

const targetPings = `      setPlatformPings(prev => {
        return {
          ...prev,`;
const replacePings = `      setPlatformPings(prev => {
        return {
          ...prev,
          spotify: 10,`;
code = code.replace(targetPings, replacePings);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched tabs with Spotify");
