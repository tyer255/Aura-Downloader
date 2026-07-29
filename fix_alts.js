import fs from 'fs';
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/alt="thumbnail"/g, 'alt={item.title || "Media thumbnail"}');
appCode = appCode.replace(/alt="" className="w-full h-full object-cover"/g, 'alt={item.title || "Playlist track thumbnail"} className="w-full h-full object-cover"');
appCode = appCode.replace(/alt="Logo"/g, 'alt={`Avatar for ${result.profile.displayName || result.profile.username || "User"}`}');
appCode = appCode.replace(/alt="Banner"/g, 'alt={`Banner for ${result.profile.displayName || result.profile.username || "User"}`}');
appCode = appCode.replace(/alt="Thumbnail" className="w-full h-full object-cover"/g, 'alt={result.title || "Media thumbnail"} className="w-full h-full object-cover"');
appCode = appCode.replace(/<img\s*src=\{getProxiedUrl\(activeItem\.url\)\}/g, '<img alt={activeItem.title || "Full size media preview"} src={getProxiedUrl(activeItem.url)}');

fs.writeFileSync('src/App.tsx', appCode);

let spotifyCode = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');
spotifyCode = spotifyCode.replace(/alt="Cover"/g, 'alt={`Cover art for ${title}`}');
fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', spotifyCode);

console.log('Fixed alt tags');
