import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add originalUrl when setting result
code = code.replace(/setResult\(data\);/g, 'setResult(data ? { ...data, originalUrl: url.trim() } : null);');

// 2. Fix the "Download All Playlist ZIP" button size issue
const btnSearch = '"w-full sm:w-auto px-8 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 text-sm sm:text-base uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98]"';
const btnReplace = '"w-full sm:w-auto px-6 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0 max-w-full overflow-hidden whitespace-nowrap"';

code = code.replace(btnSearch, btnReplace);

code = code.replace(
  /\{downloadingPlaylist \n\s*\? \`Packaging Playlist ZIP \(\$\{playlistProgress\?\.percent \|\| 0\}%\)\` \n\s*: \`Download All Playlist ZIP \(\$\{uniquePlaylistMedia\.length\} Tracks\)\`\}/g,
  '<span className="truncate max-w-full">{downloadingPlaylist ? `Packaging Playlist ZIP (${playlistProgress?.percent || 0}%)` : `Download All Playlist ZIP (${uniquePlaylistMedia.length} Tracks)`}</span>'
);

code = code.replace(
  /function QRCodeButton\(\{ url, className, isLight \}: \{ url: string; className\?: string; isLight\?: boolean \}\) \{/g,
  'function QRCodeButton({ url, originalUrl, className, isLight }: { url: string; originalUrl?: string; className?: string; isLight?: boolean }) {'
);

code = code.replace(
  /function CopyButton\(\{ url, className, isLight \}: \{ url: string; className\?: string; isLight\?: boolean \}\) \{/g,
  'function CopyButton({ url, originalUrl, className, isLight }: { url: string; originalUrl?: string; className?: string; isLight?: boolean }) {'
);

const getSafeUrlHelper = `
function getSafeUrl(targetUrl: string, originalUrl?: string) {
  if (!targetUrl) return originalUrl || '';
  if (targetUrl.includes('/api/spotify-resolve') || targetUrl.includes('/api/download') || targetUrl.includes('/api/proxy') || targetUrl.startsWith('/api/')) {
    return originalUrl || '';
  }
  return targetUrl;
}
`;

code = code.replace(
  "import { DownloadResult } from './types';",
  "import { DownloadResult } from './types';\n" + getSafeUrlHelper
);

const copyHandlerSearch = `  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };`;

const copyHandlerReplace = `  const handleCopyLink = async () => {
    try {
      const target = getSafeUrl(url, originalUrl);
      if (!target) return;
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };`;

code = code.replace(copyHandlerSearch, copyHandlerReplace); // Replace for CopyButton
code = code.replace(copyHandlerSearch, copyHandlerReplace); // Replace for QRCodeButton

// In QRCodeButton, replace: `toDataURL(url, {` -> `toDataURL(getSafeUrl(url, originalUrl), {`
code = code.replace(/toDataURL\(url, \{/g, 'toDataURL(getSafeUrl(url, originalUrl), {');

// In QRCodeButton render: replace `{url}` with `{getSafeUrl(url, originalUrl)}` safely:
// It looks like:
//                   <div className={clsx(
//                     "flex-1 p-2.5 rounded-xl text-xs font-mono truncate select-all border",
//                     isLight ? "bg-neutral-50 border-neutral-200 text-neutral-600" : "bg-black/40 border-white/5 text-neutral-400"
//                   )}>
//                     {url}
//                   </div>
code = code.replace(
  /\{url\}/g,
  (match, offset, str) => {
     const before = str.substring(offset - 100, offset);
     if (before.includes('truncate select-all border')) {
       return '{getSafeUrl(url, originalUrl)}';
     }
     return match;
  }
);

// We must also update all <CopyButton url={...} /> to <CopyButton url={...} originalUrl={result?.originalUrl} />
// Except in PlaylistItem we need to pass originalUrl down.
// Let's just do a replace for the calls inside App.tsx:
code = code.replace(/<CopyButton url=\{([^}]+)\} isLight=\{isLight\}/g, '<CopyButton url={$1} originalUrl={result?.originalUrl} isLight={isLight}');
code = code.replace(/<QRCodeButton url=\{([^}]+)\} isLight=\{isLight\}/g, '<QRCodeButton url={$1} originalUrl={result?.originalUrl} isLight={isLight}');

// Add originalUrl to PlaylistItem component signature:
code = code.replace(
  /function PlaylistItem\(\{ item, index, isLight, onDownloadQueue, activeDownloads \}: \{/g,
  'function PlaylistItem({ item, index, isLight, onDownloadQueue, activeDownloads, originalUrl }: {'
);
code = code.replace(
  /item: any;\n\s*index: number;\n\s*isLight: boolean;\n\s*onDownloadQueue: \(url: string, filename: string\) => void;\n\s*activeDownloads: Set<string>;/g,
  'item: any;\n  index: number;\n  isLight: boolean;\n  onDownloadQueue: (url: string, filename: string) => void;\n  activeDownloads: Set<string>;\n  originalUrl?: string;'
);

// Update calls to PlaylistItem
code = code.replace(
  /<PlaylistItem\s*key=\{index\}\s*item=\{item\}\s*index=\{index\}\s*isLight=\{isLight\}\s*onDownloadQueue=\{/g,
  '<PlaylistItem key={index} item={item} index={index} isLight={isLight} originalUrl={result?.originalUrl} onDownloadQueue={'
);

// Inside PlaylistItem, fix CopyButton / QRCodeButton
code = code.replace(
  /<CopyButton url=\{item.url\} isLight=\{isLight\} className="w-full sm:flex-1 rounded-xl px-3 py-2\.5 text-xs justify-center" \/>/g,
  '<CopyButton url={item.url} originalUrl={originalUrl} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />'
);
code = code.replace(
  /<QRCodeButton url=\{item.url\} isLight=\{isLight\} className="w-full sm:flex-1 rounded-xl px-3 py-2\.5 text-xs justify-center" \/>/g,
  '<QRCodeButton url={item.url} originalUrl={originalUrl} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />'
);

// The same for the other places in PlaylistItem:
code = code.replace(
  /<CopyButton url=\{item.qualities\?\.\[0\]\?\.url \|\| item\.url \|\| ''\} isLight=\{isLight\} className="w-full/g,
  '<CopyButton url={item.qualities?.[0]?.url || item.url || ""} originalUrl={originalUrl} isLight={isLight} className="w-full'
);
code = code.replace(
  /<QRCodeButton url=\{item.qualities\?\.\[0\]\?\.url \|\| item\.url \|\| ''\} isLight=\{isLight\} className="w-full/g,
  '<QRCodeButton url={item.qualities?.[0]?.url || item.url || ""} originalUrl={originalUrl} isLight={isLight} className="w-full'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Done replacements!');
