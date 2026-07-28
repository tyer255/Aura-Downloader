import fs from 'fs';
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix ZIP button
const zipBtnSearch = '"w-full sm:w-auto px-6 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0 max-w-full overflow-hidden whitespace-nowrap"';
const zipBtnReplace = '"w-full sm:w-auto px-4 py-3 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0 w-full overflow-hidden whitespace-normal text-center leading-snug"';
appCode = appCode.replace(zipBtnSearch, zipBtnReplace);

const zipSpanSearch = '<span className="truncate max-w-full">{downloadingPlaylist ? `Packaging Playlist ZIP (${playlistProgress?.percent || 0}%)` : `Download All Playlist ZIP (${uniquePlaylistMedia.length} Tracks)`}</span>';
const zipSpanReplace = '<span className="break-words max-w-full">{downloadingPlaylist ? `Packaging Playlist ZIP (${playlistProgress?.percent || 0}%)` : `Download All Playlist ZIP (${uniquePlaylistMedia.length} Tracks)`}</span>';
appCode = appCode.replace(zipSpanSearch, zipSpanReplace);

// 2. Share functionality
const getSafeUrlHelperOld = `function getSafeUrl(targetUrl: string, originalUrl?: string) {
  if (!targetUrl) return originalUrl || '';
  if (targetUrl.includes('/api/spotify-resolve') || targetUrl.includes('/api/download') || targetUrl.includes('/api/proxy') || targetUrl.startsWith('/api/')) {
    return originalUrl || '';
  }
  return targetUrl;
}`;
const getShareTextHelper = `function getSafeUrl(targetUrl: string, originalUrl?: string) {
  if (!targetUrl) return originalUrl || '';
  if (targetUrl.includes('/api/spotify-resolve') || targetUrl.includes('/api/download') || targetUrl.includes('/api/proxy') || targetUrl.startsWith('/api/')) {
    return originalUrl || '';
  }
  return targetUrl;
}

function getShareText(targetUrl: string, originalUrl?: string) {
  const safeUrl = getSafeUrl(targetUrl, originalUrl) || originalUrl || targetUrl;
  let platform = "this media";
  if (safeUrl.includes("spotify.com") || safeUrl.includes("spotify")) platform = "this Spotify track";
  else if (safeUrl.includes("youtube.com") || safeUrl.includes("youtu.be")) platform = "this YouTube video";
  else if (safeUrl.includes("instagram.com")) platform = "this Instagram post";
  else if (safeUrl.includes("pinterest.com") || safeUrl.includes("pin.it")) platform = "this Pinterest pin";
  else if (safeUrl.includes("tiktok.com")) platform = "this TikTok video";
  else if (safeUrl.includes("snapchat.com")) platform = "this Snapchat media";
  else if (safeUrl.includes("x.com") || safeUrl.includes("twitter.com")) platform = "this X post";
  else if (safeUrl.includes("reddit.com")) platform = "this Reddit post";

  const sourceStr = safeUrl && !safeUrl.includes('/api/') ? \`\\n\\nSource: \${safeUrl}\` : '';
  return \`I just downloaded \${platform} using AURA Downloader! 🚀\${sourceStr}\\n\\nGet the app: https://aura-download.ai.studio\`;
}`;
appCode = appCode.replace(getSafeUrlHelperOld, getShareTextHelper);

const handleCopySearch = `  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const target = getSafeUrl(url, originalUrl);
      if (!target) return;
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };`;
const handleCopyReplace = `  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const text = getShareText(url, originalUrl);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };`;
appCode = appCode.replace(handleCopySearch, handleCopyReplace);

const generateQRSearch = `toDataURL(getSafeUrl(url, originalUrl), {`;
const generateQRReplace = `toDataURL(getShareText(url, originalUrl), {`;
appCode = appCode.replace(generateQRSearch, generateQRReplace);

const qrInputSearch = `<div className={clsx(
                    "flex-1 p-2.5 rounded-xl text-xs font-mono truncate select-all border",
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-600" : "bg-black/40 border-white/5 text-neutral-400"
                  )}>
                    {getSafeUrl(url, originalUrl)}
                  </div>`;
const qrInputReplace = `<textarea 
                    readOnly
                    className={clsx(
                      "flex-1 p-2.5 rounded-xl text-[10px] sm:text-xs font-sans font-medium resize-none h-24 outline-none border overflow-y-auto leading-relaxed whitespace-pre-wrap break-words text-left shadow-inner",
                      isLight ? "bg-neutral-50/70 border-neutral-200 text-neutral-700" : "bg-black/40 border-white/10 text-neutral-300"
                    )}
                    value={getShareText(url, originalUrl)}
                  />`;
appCode = appCode.replace(qrInputSearch, qrInputReplace);

// 3. Hide ugly errors
appCode = appCode.replace(
  /\{result\.message \|\| result\.error \|\| "The link may be invalid, private, or unsupported\. Please check the URL and try again\."\}/g,
  `{(() => {
    const msg = result.message || result.error || "The link may be invalid, private, or unsupported. Please check the URL and try again.";
    if (typeof msg !== 'string' || msg.includes('{') || msg.includes('Error:') || msg.includes('failed with status') || msg.length > 150) {
      return "Extraction failed. Please try again later.";
    }
    return msg;
  })()}`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed App.tsx successfully');
