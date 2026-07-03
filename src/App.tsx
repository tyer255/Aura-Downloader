import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, Youtube, History, Download, Film, Music, Tv, MessageSquare, Image as ImageIcon, Instagram, Facebook, ListVideo, User, X, ChevronLeft, ChevronRight, Maximize2, Copy, Check, Sparkles, Sun, Moon, QrCode, Star, Trash2, Upload, ExternalLink, Filter, Calendar, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadResult } from './types';
import clsx from 'clsx';
import QRCode from 'qrcode';

const getProxiedUrl = (url?: string, inline = true) => {
  if (!url) return '/images/avatar_placeholder.png';
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // For Instagram/Facebook CDNs, always proxy to bypass client-side CORS/403 blocks
  if (url.includes('instagram.com') || url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
    return `/api/proxy-download?url=${encodeURIComponent(url)}&inline=true`;
  }
  // For inline media (thumbnails, video previews), load directly from source CDNs
  // to avoid server-side rate limits and bandwidth bottlenecks.
  if (inline) {
    return url;
  }
  // Only proxy for actual downloads to force the Content-Disposition header
  return `/api/proxy-download?url=${encodeURIComponent(url)}`;
};

type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit';

const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string }[] = [
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', description: 'Extract high-quality Pinterest images, videos, and GIFs. Simply paste the Pin link and let our extraction system do the rest.' },
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', description: 'Extract high-quality YouTube videos, shorts, audio, playlists, channels, and community posts. Simply paste the link and let our extraction system do the rest.' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', description: 'Extract high-quality Instagram reels, posts, photos, carousels, and stories. Simply paste the post link and let our extraction system do the rest.' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', description: 'Extract high-quality TikTok videos (without watermark) and slideshows. Simply paste the TikTok link and let our extraction system do the rest.' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', description: 'Extract high-quality Facebook videos, reels, and posts. Simply paste the link and let our extraction system do the rest.' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', description: 'Extract high-quality Reddit videos with audio, image galleries, and posts. Simply paste the link and let our extraction system do the rest.' },
];

const detectPlatformFromUrl = (url: string): Tab | null => {
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
  return null;
};

const getTabLabel = (id: Tab): string => {
  const tab = TABS.find(t => t.id === id);
  return tab ? tab.label : id;
};

const getPlatformDetails = (platform: Tab): { icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string } => {
  switch (platform) {
    case 'pinterest':
      return {
        icon: <ImageIcon className="w-3.5 h-3.5" />,
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20'
      };
    case 'instagram':
      return {
        icon: <Instagram className="w-3.5 h-3.5" />,
        colorClass: 'text-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/20'
      };
    case 'youtube':
      return {
        icon: <Youtube className="w-3.5 h-3.5" />,
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20'
      };
    case 'tiktok':
      return {
        icon: <Music className="w-3.5 h-3.5" />,
        colorClass: 'text-teal-400',
        bgClass: 'bg-teal-500/10',
        borderClass: 'border-teal-500/20'
      };
    case 'facebook':
      return {
        icon: <Facebook className="w-3.5 h-3.5" />,
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20'
      };
    case 'reddit':
      return {
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500/20'
      };
    default:
      return {
        icon: <History className="w-3.5 h-3.5" />,
        colorClass: 'text-neutral-500',
        bgClass: 'bg-neutral-500/10',
        borderClass: 'border-neutral-500/20'
      };
  }
};

const LOADING_STEPS = [
  { text: "🔍 Analyzing URL format & initiating platform handshake...", target: 15 },
  { text: "📡 Establishing cloud-allocated secure fetch tunnel...", target: 38 },
  { text: "⚙️ Extracting structured metadata, stream links & JSON maps...", target: 65 },
  { text: "🖼️ Locating high-resolution photo frames & video streams...", target: 88 },
  { text: "⚡ Packing download buffers and wrapping files for instant download...", target: 98 },
];

// Dedicated component for copy-to-clipboard functionality with a modern transition state
function CopyButton({ url, className, isLight }: { url: string; className?: string; isLight?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 font-bold transition-all uppercase tracking-wider border select-none cursor-pointer duration-300 shadow-sm",
        copied
          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
          : isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10",
        className
      )}
      title="Copy Direct Link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-scale-in" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
}

// Reusable component to generate and display a QR code for quick mobile downloads/access
function QRCodeButton({ url, className, isLight }: { url: string; className?: string; isLight?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1516',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR Code');
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    generateQR();
    setIsOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={clsx(
          "inline-flex items-center justify-center gap-1.5 font-bold transition-all uppercase tracking-wider border select-none cursor-pointer duration-300 shadow-sm",
          isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10",
          className
        )}
        title="Get QR Code for Mobile"
      >
        <QrCode className="w-4 h-4" />
        <span>QR Code</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 border flex flex-col items-center relative transition-all duration-300",
                isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#1c0d0f] border-white/10 text-white"
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer",
                  isLight ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100" : "text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              <QrCode className="w-8 h-8 text-[#ff1e42] mb-2" />
              <h3 className="text-lg font-extrabold mb-1 tracking-tight">Scan for Mobile Access</h3>
              <p className={clsx("text-xs text-center mb-6 max-w-[250px] leading-relaxed", isLight ? "text-neutral-500" : "text-neutral-400")}>
                Scan this code with your mobile camera to quickly access or download this file on your phone.
              </p>

              {/* QR Image Frame */}
              <div className={clsx(
                "p-4 rounded-2xl border flex items-center justify-center mb-6 bg-white shadow-xl transition-all",
                isLight ? "border-neutral-200" : "border-white/5"
              )}>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 select-none rounded-lg" />
                ) : error ? (
                  <div className="w-44 h-44 flex items-center justify-center text-red-500 text-xs font-semibold text-center">
                    {error}
                  </div>
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#ff1e42] animate-spin" />
                  </div>
                )}
              </div>

              {/* URL input field so they can also copy/read it */}
              <div className="w-full">
                <span className={clsx("text-[10px] uppercase font-black tracking-wider block mb-1.5", isLight ? "text-neutral-400" : "text-neutral-500")}>
                  Target Direct Link:
                </span>
                <div className="flex gap-2">
                  <div className={clsx(
                    "flex-1 p-2.5 rounded-xl text-xs font-mono truncate select-all border",
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-600" : "bg-black/40 border-white/5 text-neutral-400"
                  )}>
                    {url}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={clsx(
                      "p-2.5 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                      copied
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : isLight
                          ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                    )}
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pinterest');
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<{
    title: string;
    message: string;
    targetTab: Tab;
    targetTabName: string;
  } | null>(null);

  const handleUrlChange = (newUrl: string, explicitTab?: Tab) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setValidationError(null);
      return;
    }
    const currentActive = explicitTab || activeTab;
    const detected = detectPlatformFromUrl(newUrl);
    if (detected && detected !== currentActive) {
      setValidationError({
        title: "Platform Mismatch Detected",
        message: `This URL belongs to ${getTabLabel(detected)}. It won't work correctly on the ${getTabLabel(currentActive)} downloader.`,
        targetTab: detected,
        targetTabName: getTabLabel(detected)
      });
    } else {
      setValidationError(null);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistorySpinning, setIsHistorySpinning] = useState(false);
  const [history, setHistory] = useState<{ url: string; title: string; timestamp: number; platform?: Tab; favorite?: boolean; thumbnail?: string; appName?: string }[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [copiedHistoryUrl, setCopiedHistoryUrl] = useState<string | null>(null);
  const [historyToast, setHistoryToast] = useState<string | null>(null);

  const triggerHistoryToast = (msg: string) => {
    setHistoryToast(msg);
    setTimeout(() => {
      setHistoryToast(null);
    }, 2500);
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('download_history');
    setConfirmClearAll(false);
    triggerHistoryToast("History cleared successfully!");
  };

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxMediaList, setLightboxMediaList] = useState<{ url: string; type: 'video' | 'image'; title?: string }[]>([]);

  const [isLight, setIsLight] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored !== null) return stored === 'light';
      return true; // Default to light mode
    } catch (e) {
      return true; // Default to light mode on error
    }
  });

  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    } catch (e) {}
  }, [isLight]);



  // Manage loading step label text sequence separately
  React.useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(stepInterval);
  }, [isLoading]);

  // Load history from localstorage
  React.useEffect(() => {
    const stored = localStorage.getItem('download_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  // Handle PWA Web Share Target
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text');
    const sharedUrl = params.get('url');

    let finalUrl = '';
    
    if (sharedUrl && (sharedUrl.startsWith('http://') || sharedUrl.startsWith('https://'))) {
      finalUrl = sharedUrl;
    } else if (sharedText) {
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        finalUrl = urlMatch[0];
      }
    }

    if (finalUrl) {
      const platform = detectPlatformFromUrl(finalUrl);
      if (platform) {
        setActiveTab(platform);
      }
      setUrl(finalUrl);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Lightbox keyboard navigation & body scroll lock
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && lightboxMediaList.length > 1) {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return (prev + 1) % lightboxMediaList.length;
        });
      } else if (e.key === 'ArrowLeft' && lightboxMediaList.length > 1) {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return (prev - 1 + lightboxMediaList.length) % lightboxMediaList.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, lightboxMediaList]);

  const activeTabData = TABS.find(t => t.id === activeTab)!;

  const getYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Check platform matching before proceeding
    const detected = detectPlatformFromUrl(url);
    if (detected && detected !== activeTab) {
      setValidationError({
        title: "Platform Mismatch Detected",
        message: `This URL belongs to ${getTabLabel(detected)}. It won't work correctly on the ${getTabLabel(activeTab)} downloader.`,
        targetTab: detected,
        targetTabName: getTabLabel(detected)
      });
      return;
    }

    
    setLoadingStep(0);
    setIsLoading(true);
    setResult(null);

    // Default multi-platform downloader
    try {
      const detectedPlatform = detectPlatformFromUrl(url.trim()) || activeTab;

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await res.json();
      setResult(data);
      
      if (data.success) {
        const titleText = data.profile 
          ? `Profile: @${data.profile.username}` 
          : (data.title || 'Media Download');
        const detectedPlatform = detectPlatformFromUrl(url.trim()) || activeTab;
        const newEntry = { 
          url: url.trim(), 
          title: titleText, 
          timestamp: Date.now(), 
          platform: detectedPlatform,
          favorite: false,
          thumbnail: data.thumbnail || (data.media && data.media.length > 0 ? (data.media[0].thumbnail || data.media[0].url) : undefined) || data.profile?.avatarUrl,
          appName: TABS.find(t => t.id === detectedPlatform)?.name || 'Unknown'
        };
        const newHistory = [newEntry, ...history.filter(h => h.url !== url.trim())].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem('download_history', JSON.stringify(newHistory));
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error occurred while trying to contact the media server."
      });
    } finally {
      
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const downloadFileClientSide = async (url: string, filename: string) => {
    try {
      setDownloadProgress(0);
      setHistoryToast("Starting download...");

      const fetchUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        setHistoryToast("Download failed (Server Error).");
        setTimeout(() => setHistoryToast(null), 3000);
        setDownloadProgress(null);
        return;
      }

      const contentLength = response.headers.get('content-length') || response.headers.get('estimated-content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          }
        }
      }

      const blob = new Blob(chunks);
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      setDownloadProgress(null);
      setHistoryToast("Download complete!");
      setTimeout(() => setHistoryToast(null), 3000);
    } catch (error) {
      console.error('Download setup failed:', error);
      setDownloadProgress(null);
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
    }
  };

  const handleDownloadAll = () => {
    if (!result || !result.media) return;
    result.media.forEach((item, index) => {
      setTimeout(() => {
        downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item_" + (index + 1) + ".mp4");
      }, index * 600); // delay to prevent overwhelming
    });
  };

  const getBgGlow = (id: Tab) => {
    if (isLight) {
      switch(id) {
        case 'youtube':
        case 'instagram': return 'from-purple-100/60 via-pink-50/30 to-neutral-50';
        case 'tiktok': return 'from-cyan-100/60 via-teal-50/20 to-neutral-50';
        case 'facebook': return 'from-blue-100/60 via-indigo-50/20 to-neutral-50';
        case 'reddit': return 'from-orange-100/60 via-amber-50/20 to-neutral-50';
        case 'pinterest': return 'from-rose-100/60 via-pink-50/10 to-neutral-50';
        default: return 'from-neutral-100/80 via-neutral-50/40 to-neutral-50';
      }
    }
    switch(id) {
      case 'youtube':
      case 'instagram': return 'from-purple-950/40 via-[#180a14] to-[#0a040b]';
      case 'tiktok': return 'from-cyan-950/30 via-[#0a1416] to-[#04090b]';
      case 'facebook': return 'from-blue-950/40 via-[#0b0e1a] to-[#05070f]';
      case 'reddit': return 'from-orange-950/40 via-[#1b0d0a] to-[#0f0705]';
      case 'pinterest': return 'from-rose-950/40 via-[#1a0a0f] to-[#0f0508]';
      default: return 'from-[#1c1917]/20 via-[#141210] to-[#0c0a09]';
    }
  };

  return (
    <div className={clsx(
      "min-h-screen bg-gradient-to-b flex flex-col items-center pt-8 pb-12 px-4 font-sans transition-colors duration-700",
      isLight ? "text-neutral-900 selection:bg-red-500/10" : "text-neutral-50 selection:bg-red-500/30",
      getBgGlow(activeTab)
    )}>
      
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-16 relative z-20">
        <div className={clsx(
          "flex items-center rounded-full pl-4 pr-1.5 py-1.5 transition-colors border",
          isLight ? "bg-white border-neutral-200 text-neutral-600" : "bg-white/5 border border-white/10 text-neutral-400"
        )}>
          <span className="text-sm font-medium tracking-wide mr-3 uppercase">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-sm px-4 py-1.5 rounded-full font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
             <Youtube className="w-4 h-4" /> Subscribe
          </a>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsLight(!isLight)}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
          >
            {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => {
              setIsHistorySpinning(true);
              setTimeout(() => {
                setIsHistorySpinning(false);
                setShowHistory(true);
              }, 400);
            }}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10",
              isHistorySpinning && "animate-spin"
            )}
            title="Download History"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Glassmorphic Prism Sliding History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Ambient Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all"
            />
            
            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              
              {/* Close Slider Button on the Side (Floating on the left edge) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-14 z-30"
              >
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all hover:scale-110 active:scale-95 border bg-[#180a0c]/90 border-white/10 text-white hover:bg-neutral-900 shadow-black/80"
                  title="Close Slider"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 30, stiffness: 220 }}
                className={clsx(
                  "w-screen max-w-md border-l flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all will-change-transform bg-black/75 backdrop-blur-3xl border-neutral-800 text-neutral-100"
                )}
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                }}
              >
                {/* Rainbow/Prism Underlay Glow Blobs */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-50">
                  <div className="absolute -top-[10%] -left-[20%] w-[80%] h-[50%] rounded-full bg-gradient-to-br from-red-500/20 via-pink-500/15 to-transparent blur-3xl" />
                  <div className="absolute top-[25%] -right-[20%] w-[80%] h-[50%] rounded-full bg-gradient-to-br from-blue-500/15 via-teal-500/10 to-transparent blur-3xl" />
                  <div className="absolute bottom-[5%] left-[10%] w-[70%] h-[40%] rounded-full bg-gradient-to-br from-amber-500/10 via-purple-500/15 to-transparent blur-3xl" />
                </div>

                {/* Top Glass Prism Glimmer line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-red-500/80 via-pink-500/80 via-purple-500/80 via-blue-500/80 via-emerald-500/80 to-yellow-500/80 opacity-90" />

                {/* Header with Title & Clear All Button on Top */}
                <div className="p-5 flex items-center justify-between border-b border-white/5 bg-black/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-500/10 rounded-xl shrink-0 border border-red-500/20">
                      <History className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight uppercase">History</h2>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">{history.length} items</p>
                    </div>
                  </div>

                  {/* Clear All on the Top */}
                  {history.length > 0 && (
                    <div>
                      {confirmClearAll ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                          <button
                            onClick={clearAllHistory}
                            className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 font-bold text-white text-[10px] transition-all cursor-pointer uppercase tracking-wider"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmClearAll(false)}
                            className="px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer uppercase tracking-wider bg-white/10 text-neutral-300 hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmClearAll(true)}
                          className="px-3 py-1.5 rounded-full border text-[10px] font-black cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5 bg-white/5 border-white/10 text-neutral-300 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* History list content */}
                <div className="overflow-y-auto p-5 flex-1 space-y-3 no-scrollbar relative z-10">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-28 px-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border shadow-sm bg-white/5 border-white/10">
                        <History className="w-5 h-5 text-neutral-400" />
                      </div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider">No archives</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mt-1 leading-relaxed font-medium">
                        References will be saved automatically here for rapid one-click retrieval.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {history.map((item, idx) => {
                        const platDetails = getPlatformDetails(item.platform || 'pinterest');
                        const isCopied = copiedHistoryUrl === item.url;

                        const handleCopyUrl = async (e: React.MouseEvent) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(item.url);
                            setCopiedHistoryUrl(item.url);
                            triggerHistoryToast("Copied successfully! 📋");
                            setTimeout(() => setCopiedHistoryUrl(null), 2000);
                          } catch (err) {}
                        };

                        const handleDelete = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const updated = history.filter((_, i) => i !== idx);
                          setHistory(updated);
                          localStorage.setItem('download_history', JSON.stringify(updated));
                          triggerHistoryToast("Removed from history 🗑️");
                        };

                        return (
                          <motion.div
                            key={item.url + '_' + idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="border rounded-2xl p-4 transition-all relative flex flex-col gap-2 group/item overflow-hidden bg-white/5 hover:bg-white/10 border-white/10 shadow-md"
                            style={{
                              boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.15)"
                            }}
                          >
                            {/* Card Top Header: Platform indicator & Close Button on the Side */}
                            <div className="flex items-center justify-between">
                              <span className={clsx(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                platDetails.bgClass,
                                platDetails.borderClass,
                                platDetails.colorClass
                              )}>
                                {platDetails.icon}
                                <span>{getTabLabel(item.platform || 'pinterest')}</span>
                              </span>
                              
                              {/* Close/Remove Button on the Side of each card */}
                              <button
                                onClick={handleDelete}
                                className="p-1.5 rounded-full transition-colors cursor-pointer text-neutral-400 hover:text-red-400 hover:bg-white/5"
                                title="Remove item"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Card Body: Title and URL */}
                            <div 
                              onClick={() => {
                                handleUrlChange(item.url, item.platform);
                                if (item.platform) {
                                  setActiveTab(item.platform);
                                }
                                setShowHistory(false);
                              }}
                              className="text-left cursor-pointer flex-1 flex gap-3 mt-1 items-center"
                            >
                              {item.thumbnail && (
                                <div className="w-12 h-12 rounded-lg bg-neutral-900 shrink-0 overflow-hidden border border-white/10 shadow-sm">
                                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-sm line-clamp-1 transition-colors hover:underline decoration-red-500 decoration-2 text-white">
                                  {item.appName ? `${item.appName} - ` : ''}{item.title}
                                </h4>
                                <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5 select-all">
                                  {item.url}
                                </p>
                              </div>
                            </div>

                            {/* Card Footer actions: Copy & Load */}
                            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-white/5 mt-1">
                              {/* Copy Button */}
                              <button
                                onClick={handleCopyUrl}
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all hover:scale-[1.02] active:scale-[0.98] bg-white/5 hover:bg-white/10 border-white/5 text-white"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-green-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy URL</span>
                                  </>
                                )}
                              </button>

                              {/* Load button */}
                              <button
                                onClick={() => {
                                  handleUrlChange(item.url, item.platform);
                                  if (item.platform) {
                                    setActiveTab(item.platform);
                                  }
                                  setShowHistory(false);
                                }}
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-white text-neutral-900 hover:bg-neutral-100"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Load URL</span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

                {/* Floating toast notification */}
                <AnimatePresence>
                  {historyToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute bottom-6 left-6 right-6 z-40 bg-neutral-900 text-white text-[11px] font-bold py-3 px-4 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 backdrop-blur-md"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      <span>{historyToast}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Slider Footer */}
                <div className="p-4 border-t flex justify-center transition-colors relative z-10 border-white/5 bg-black/15">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border text-center hover:scale-[1.01] active:scale-[0.99] bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  >
                    Close Slider
                  </button>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl flex flex-col items-center text-center relative z-10">
        
        {/* Navigation Tabs Bar */}
        <div className={clsx(
          "w-full max-w-2xl border rounded-2xl p-2 flex items-center overflow-x-auto no-scrollbar mb-8 shadow-2xl relative z-10 transition-colors",
          isLight ? "bg-white border-neutral-200/80" : "bg-[#1e1516] border-white/5"
        )}>
          <div className="flex items-center min-w-max gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              
              const getTabColor = (id: Tab) => {
                if (isLight) {
                  switch(id) {
                    case 'youtube': return 'shadow-[0_0_15px_rgba(255,0,0,0.15)]';
                    case 'instagram': return 'shadow-[0_0_15px_rgba(225,48,108,0.15)]';
                    case 'tiktok': return 'shadow-[0_0_15px_rgba(0,242,254,0.15)]';
                    case 'facebook': return 'shadow-[0_0_15px_rgba(24,119,242,0.15)]';
                    case 'reddit': return 'shadow-[0_0_15px_rgba(255,69,0,0.15)]';
                    case 'pinterest': return 'shadow-[0_0_15px_rgba(230,0,35,0.15)]';
                    default: return 'shadow-md';
                  }
                }
                switch(id) {
                  case 'youtube': return 'shadow-[0_0_15px_rgba(255,0,0,0.4)]';
                  case 'instagram': return 'shadow-[0_0_15px_rgba(225,48,108,0.4)]';
                  case 'tiktok': return 'shadow-[0_0_15px_rgba(0,242,254,0.4)]';
                  case 'facebook': return 'shadow-[0_0_15px_rgba(24,119,242,0.4)]';
                  case 'reddit': return 'shadow-[0_0_15px_rgba(255,69,0,0.4)]';
                  case 'pinterest': return 'shadow-[0_0_15px_rgba(230,0,35,0.4)]';
                  default: return 'shadow-md';
                }
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setValidationError(null);
                    // Retain the URL if it happens to match the newly selected tab, or clear it if it doesn't
                    const detected = detectPlatformFromUrl(url);
                    if (detected !== tab.id) {
                      setUrl('');
                    } else {
                      setValidationError(null);
                    }
                  }}
                  className={clsx(
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative",
                    isActive 
                      ? isLight 
                        ? "text-white" 
                        : "text-black"
                      : isLight
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-neutral-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className={clsx(
                        "absolute inset-0 rounded-xl -z-10 transition-colors duration-500",
                        isLight ? "bg-neutral-900" : "bg-white",
                        getTabColor(tab.id)
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab-switching Dynamic Content Wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full flex flex-col items-center"
          >
            {/* Active Tab Badge */}
            <div className={clsx(
              "inline-flex items-center gap-2 border text-sm px-5 py-2 rounded-full mb-8 shadow-sm transition-colors",
              isLight ? "bg-white border-neutral-200 text-neutral-800" : "bg-white/5 border border-white/10 text-neutral-200"
            )}>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              {activeTabData.name}
            </div>

            {/* Hero Area */}
            <h1 className={clsx(
              "text-5xl sm:text-[3.5rem] leading-[1.1] font-bold mb-6 transition-colors",
              isLight ? "text-neutral-900" : "text-white"
            )}>
              Download<br />Anything.
            </h1>
            <p className={clsx(
              "text-[1.1rem] leading-relaxed max-w-sm mx-auto mb-16 transition-colors",
              isLight ? "text-neutral-600" : "text-neutral-400"
            )}>
              {activeTabData.description}
            </p>

            {/* Platform Mismatch Warning Alert Box */}
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "w-full max-w-2xl p-4.5 rounded-3xl mb-8 border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium transition-colors text-left shadow-lg backdrop-blur-sm",
                    isLight 
                      ? "bg-amber-50/90 border-amber-200 text-amber-900" 
                      : "bg-amber-950/20 border-amber-500/20 text-amber-200"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <AlertCircle className="w-5.5 h-5.5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-base tracking-tight mb-0.5">{validationError.title}</h4>
                      <p className={clsx("text-xs font-medium leading-relaxed", isLight ? "text-neutral-600" : "text-neutral-400")}>
                        {validationError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const prevUrl = url;
                      setActiveTab(validationError.targetTab);
                      setResult(null);
                      setValidationError(null);
                      setUrl(prevUrl);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold transition-all text-xs cursor-pointer shadow-md hover:shadow-lg shadow-amber-500/20 whitespace-nowrap uppercase tracking-wider"
                  >
                    Switch to {validationError.targetTabName}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search & URL Input Box */}
            {['tiktok', 'facebook', 'reddit'].includes(activeTab) ? (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={clsx(
                  "w-full max-w-2xl p-8 sm:p-12 rounded-3xl mb-12 border flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden",
                  isLight 
                    ? "bg-white/60 backdrop-blur-xl border-white/60" 
                    : "bg-[#1c0d0f]/60 backdrop-blur-xl border-white/10"
                )}
                style={{
                  boxShadow: isLight 
                    ? "inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 20px 50px rgba(0, 0, 0, 0.1)" 
                    : "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Background Blobs for Glassmorphism */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-60">
                  <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent blur-2xl" />
                  <div className="absolute bottom-[0%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-pink-500/20 via-orange-500/10 to-transparent blur-2xl" />
                </div>
                
                <div className={clsx(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border",
                  isLight ? "bg-white/80 border-white text-neutral-800" : "bg-white/10 border-white/20 text-white"
                )}>
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h4 className={clsx("font-black text-2xl mb-3 tracking-tight", isLight ? "text-neutral-900" : "text-white")}>
                    Coming Soon
                  </h4>
                  <p className={clsx("text-base font-medium max-w-sm mx-auto leading-relaxed", isLight ? "text-neutral-600" : "text-neutral-400")}>
                    Support for <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">{activeTabData.label}</span> is currently in development. Please check back later!
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleDownload} className="w-full max-w-2xl mb-12 relative">
                <div className={clsx(
                  "relative flex items-center w-full border rounded-full p-2 pl-6 sm:pl-8 shadow-2xl backdrop-blur-xl group transition-all",
                  isLight 
                    ? "bg-white border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-400" 
                    : "bg-[#1c0d0f]/80 border-white/[0.08] hover:border-white/15 focus-within:border-white/20"
                )}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={activeTabData.placeholder}
                    required
                    className={clsx(
                      "w-full bg-transparent text-base sm:text-lg placeholder-neutral-400 outline-none py-3 pr-20 transition-colors",
                      isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-500"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !url}
                    className={clsx(
                      "absolute right-2 top-2 bottom-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:opacity-50" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:opacity-50"
                    )}
                  >
                    {isLoading ? (
                      <div className={clsx(
                        "w-5 h-5 border-[2.5px] rounded-full animate-spin",
                        isLight ? "border-neutral-400/40 border-t-neutral-100" : "border-neutral-400/40 border-t-neutral-800"
                      )} />
                    ) : (
                      <Search className={clsx("w-5 h-5 sm:w-6 sm:h-6", isLight ? "text-white" : "text-neutral-800")} />
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Media Extraction Dashboard / Loading State */}
        <AnimatePresence mode="wait">
          {isLoading && (() => {
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="w-full max-w-md mx-auto flex flex-col items-center mt-4"
              >
                {/* Central Card with Spinner */}
                <div className={clsx(
                  "w-full aspect-square border rounded-[36px] flex items-center justify-center shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative mb-8 overflow-hidden transition-colors",
                  isLight ? "bg-white border-neutral-200" : "bg-[#1e1315]/70 border-[#301618]"
                )}>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className={clsx("absolute inset-0 border-4 rounded-full", isLight ? "border-neutral-200" : "border-neutral-800/60")}></div>
                    <div className={clsx("absolute inset-0 border-4 rounded-full animate-spin", isLight ? "border-t-neutral-800" : "border-t-neutral-400/80")}></div>
                  </div>
                </div>

                {/* Status / Percentage Row */}
                <div className="w-full flex justify-between items-center px-1 mb-3">
                  <span className={clsx("text-sm font-medium transition-colors", isLight ? "text-neutral-700" : "text-neutral-300")}>
                    Extracting media details...
                  </span>
                  <span className="text-sm font-bold text-blue-500">
                    {LOADING_STEPS[loadingStep].target}%
                  </span>
                </div>

                {/* Determinate Progress Bar */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden mb-4 shadow-inner transition-colors relative", 
                  isLight ? "bg-neutral-200" : "bg-neutral-800/80"
                )}>
                  <motion.div 
                    className="absolute top-0 left-0 h-full rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${LOADING_STEPS[loadingStep].target}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Status message */}
                <div className={clsx("text-sm font-semibold tracking-wide transition-colors", isLight ? "text-neutral-600" : "text-neutral-400")}>
                  {LOADING_STEPS[loadingStep].text}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.3 }}
              className="w-full text-left"
            >
              {result.success ? (
                <div className="space-y-6">
                  
                  {/* PROFILE TEMPLATE */}
                  {result.mediaType === 'profile' && result.profile && (
                    <div className={clsx(
                      "border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-colors",
                      isLight ? "bg-white border-neutral-200" : "bg-[#1e1516] border-white/10"
                    )}>
                      
                      {/* Banner Backplate */}
                      <div className="h-32 sm:h-44 bg-gradient-to-r from-red-600 via-pink-600 to-indigo-600 relative">
                        {result.profile.bannerUrl && (
                          <img 
                            src={getProxiedUrl(result.profile.bannerUrl)} 
                            alt="Cover Banner" 
                            className="w-full h-full object-cover opacity-50 cursor-zoom-in hover:opacity-70 transition-opacity" 
                            onClick={() => {
                              if (result.profile?.bannerUrl) {
                                setLightboxMediaList([{
                                  url: result.profile.bannerUrl,
                                  type: 'image',
                                  title: `${result.profile.displayName || result.profile.username || 'User'}'s Cover Banner`
                                }]);
                                setLightboxIndex(0);
                              }
                            }}
                          />
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-neutral-300 text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold">
                          PROFILE ASSET REPORT
                        </div>
                      </div>

                      {/* Header DP Circle & Info */}
                      <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
                          <div 
                            className="relative group cursor-zoom-in"
                            onClick={() => {
                              const imgUrl = result.profile?.avatarUrl || result.thumbnail;
                              if (imgUrl) {
                                setLightboxMediaList([{
                                  url: imgUrl,
                                  type: 'image',
                                  title: `${result.profile?.displayName || result.profile?.username || 'User'}'s Profile Picture`
                                }]);
                                setLightboxIndex(0);
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full blur-md opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"></div>
                            <img 
                              src={getProxiedUrl(result.profile.avatarUrl || result.thumbnail || "/images/avatar_placeholder.png")} 
                              alt="Profile DP" 
                              className={clsx(
                                "w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 relative z-10 bg-neutral-900 group-hover:scale-[1.03] transition-transform",
                                isLight ? "border-white" : "border-[#1e1516]"
                              )}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                              }}
                            />
                          </div>
                        </div>

                        {/* Names Details */}
                        <div className="mb-6">
                          <h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>
                          <p className="text-red-500 font-mono text-sm mt-1">@{result.profile.username}</p>
                          {result.profile.bio && (
                            <p className={clsx(
                              "text-sm mt-4 leading-relaxed max-w-2xl p-4 rounded-xl border transition-colors",
                              isLight ? "text-neutral-700 bg-neutral-50 border-neutral-200" : "text-neutral-300 bg-white/5 border-white/5"
                            )}>
                              {result.profile.bio}
                            </p>
                          )}
                        </div>

                        {/* Stat Counters Row */}
                        <div className={clsx(
                          "flex items-center gap-8 border-t pt-6 flex-wrap transition-colors",
                          isLight ? "border-neutral-200" : "border-white/5"
                        )}>
                          {result.profile.followers && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.followers}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Followers</p>
                            </div>
                          )}
                          {result.profile.following && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.following}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Following</p>
                            </div>
                          )}
                          {result.profile.postsCount && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.postsCount}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Posts</p>
                            </div>
                          )}
                        </div>

                        {/* Profile Assets Downloader */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {result.profile.avatarUrl && (
                            <div className={clsx(
                              "flex flex-col p-6 rounded-3xl border backdrop-blur-2xl shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden",
                              isLight ? "bg-white/80 border-white/50" : "bg-white/10 border-white/20"
                            )}>
                              {/* Glassmorphism ambient glow */}
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none" />
                              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-[40px] pointer-events-none" />
                              
                              <div className="flex flex-col items-center text-center gap-4 mb-6 relative z-10">
                                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shrink-0 border-[6px] border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-neutral-100/50 backdrop-blur-sm relative group">
                                  <img src={getProxiedUrl(result.profile.avatarUrl)} alt="Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Profile Logo</h4>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>High-resolution avatar image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                <a
                                  href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.avatarUrl!, (result.profile?.username || "user") + "_avatar.jpg"); }}
                                  className={clsx(
                                    "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5",
                                    isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
                                  )}
                                >
                                  <Download className="w-5 h-5" /> Download Logo
                                </a>
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <CopyButton url={result.profile.avatarUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                  <QRCodeButton url={result.profile.avatarUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                </div>
                              </div>
                            </div>
                          )}

                          {result.profile.bannerUrl && (
                            <div className={clsx(
                              "flex flex-col p-6 rounded-3xl border backdrop-blur-2xl shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden",
                              isLight ? "bg-white/80 border-white/50" : "bg-white/10 border-white/20"
                            )}>
                              {/* Glassmorphism ambient glow */}
                              <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] pointer-events-none" />
                              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] pointer-events-none" />

                              <div className="flex flex-col items-center text-center gap-4 mb-6 relative z-10">
                                <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden shrink-0 border-[6px] border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-neutral-100/50 backdrop-blur-sm relative group">
                                  <img src={getProxiedUrl(result.profile.bannerUrl)} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Cover Banner</h4>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>Full-width background image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                <a
                                  href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.bannerUrl!, (result.profile?.username || "user") + "_banner.jpg"); }}
                                  className={clsx(
                                    "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5",
                                    isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
                                  )}
                                >
                                  <Download className="w-5 h-5" /> Download Banner
                                </a>
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <CopyButton url={result.profile.bannerUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                  <QRCodeButton url={result.profile.bannerUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* CAROUSEL / COMMUNITY MULTI-PHOTO TEMPLATE */}
                  {result.mediaType === 'carousel' && result.media && result.media.length > 0 && (
                    <div className="space-y-6">
                      
                      {/* Top Action Control Panel */}
                      <div className={clsx(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-md border transition-colors",
                        isLight ? "bg-white border-neutral-200 shadow-md" : "bg-white/5 border border-white/10"
                      )}>
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold text-sm tracking-wide">CAROUSEL ASSETS READY</span>
                          </div>
                          <h3 className={clsx("text-xl font-bold line-clamp-1 transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.title || "Multi-File Album"}
                          </h3>
                          <p className={clsx("text-xs transition-colors mt-1", isLight ? "text-neutral-500" : "text-neutral-400")}>
                            {result.media.length} items extracted from URL link
                          </p>
                        </div>
                        <button 
                          onClick={handleDownloadAll}
                          className={clsx(
                            "px-6 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 text-sm shrink-0 uppercase tracking-wider cursor-pointer",
                            isLight ? "bg-neutral-950 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black shadow-white/10"
                          )}
                        >
                          <Download className="w-4 h-4" /> Download All
                        </button>
                      </div>

                      {/* Photo/Video Grid List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {result.media.map((item, index) => (
                          <div 
                            key={index} 
                            className={clsx(
                              "border rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:scale-[1.02] transition-all",
                              isLight ? "bg-white border-neutral-200" : "bg-white/[0.03] border-white/10 backdrop-blur-xl"
                            )}
                          >
                            
                            {/* Card Display Container */}
                            <div 
                              className="aspect-square bg-black relative overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:opacity-90 transition-opacity"
                              onClick={() => {
                                if (result.media) {
                                  const list = result.media.map((m, i) => ({
                                    url: m.url,
                                    type: m.type,
                                    title: `${result.title || 'Media'} - Item #${i + 1}`
                                  }));
                                  setLightboxMediaList(list);
                                  setLightboxIndex(index);
                                }
                              }}
                            >
                              {item.type === 'video' ? (
                                <div className="w-full h-full relative">
                                  {item.thumbnail ? (
                                    <img src={getProxiedUrl(item.thumbnail)} alt={`Video slide ${index + 1}`} className="w-full h-full object-cover opacity-80" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                      <Film className="w-10 h-10 text-neutral-600" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Tv className="w-8 h-8 text-white/80 animate-pulse animate-duration-1000" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={getProxiedUrl(item.url)} 
                                  alt={`Image slide ${index + 1}`} 
                                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                  }}
                                />
                              )}
                              <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-black">
                                ITEM #{index + 1}
                              </span>
                              <span className="absolute top-3 right-3 bg-white/10 backdrop-blur-md text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {item.type}
                              </span>
                            </div>

                             {/* Card Download Button Footer with standard quality options for videos */}
                            <div className={clsx(
                              "p-4 border-t mt-auto flex flex-col gap-3 transition-colors",
                              isLight ? "bg-neutral-50 border-neutral-100" : "bg-black/30 border-white/5"
                            )}>
                              {item.type === 'video' ? (
                                <div className="space-y-1.5">
                                  <a
                                    href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                    className={clsx(
                                      "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                                      isLight ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10"
                                    )}
                                  >
                                    <Download className="w-4 h-4" /> Download Video
                                  </a>
                                </div>
                              ) : (
                                <a
                                  href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                  
                                  className={clsx(
                                    "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                                    isLight ? "bg-white hover:bg-neutral-900 hover:text-white border-neutral-200 text-neutral-800" : "bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white"
                                  )}
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Image
                                </a>
                              )}
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <CopyButton url={item.url} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />
                                <QRCodeButton url={item.url} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* STANDARD SINGLE FILE TEMPLATE */}
                  {result.mediaType !== 'profile' && result.mediaType !== 'carousel' && (
                    <div className={clsx(
                      "border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row backdrop-blur-sm transition-colors",
                      isLight ? "bg-white border-neutral-200" : "bg-white/5 border border-white/10"
                    )}>
                      {result.thumbnail ? (
                        <div 
                          className="w-full md:w-2/5 aspect-[4/3] md:aspect-auto bg-black relative flex items-center justify-center overflow-hidden min-h-[220px] cursor-zoom-in group/thumb"
                          onClick={() => {
                            setLightboxMediaList([{
                              url: result.url || result.thumbnail || '',
                              type: result.mediaType === 'video' ? 'video' : 'image',
                              title: result.title || "Ready File Asset"
                            }]);
                            setLightboxIndex(0);
                          }}
                        >
                          <img 
                            src={getProxiedUrl(result.thumbnail)} 
                            alt="Media thumbnail" 
                            className="w-full h-full object-cover opacity-90 group-hover/thumb:scale-105 group-hover/thumb:opacity-100 transition-all duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white border border-white/20">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={clsx(
                            "w-full md:w-2/5 aspect-[4/3] md:aspect-auto flex items-center justify-center min-h-[200px] cursor-zoom-in transition-colors",
                            isLight ? "bg-neutral-100 hover:bg-neutral-200" : "bg-white/5 hover:bg-white/10"
                          )}
                          onClick={() => {
                            if (result.url) {
                              setLightboxMediaList([{
                                url: result.url,
                                type: result.mediaType === 'video' ? 'video' : 'image',
                                title: result.title || "Ready File Asset"
                              }]);
                              setLightboxIndex(0);
                            }
                          }}
                        >
                          <Film className="w-12 h-12 text-neutral-600 animate-pulse" />
                        </div>
                      )}
                      
                      <div className={clsx(
                        "p-6 md:p-8 flex-1 flex flex-col justify-center transition-colors",
                        isLight ? "bg-neutral-50/50" : "bg-black/20"
                      )}>
                        <div className="flex items-center gap-2 text-emerald-500 mb-3">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold text-sm tracking-wide">EXTRACTION SUCCESSFUL</span>
                        </div>
                        <h3 className={clsx("text-xl font-bold mb-6 line-clamp-3 leading-snug transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                          {result.title || "Ready File Asset"}
                        </h3>
                        {result.description && (
                          <p className={clsx(
                            "text-xs line-clamp-2 mb-6 leading-relaxed p-3 rounded-lg border transition-all",
                            isLight ? "text-neutral-600 bg-neutral-100/50 border-neutral-200" : "text-neutral-400 bg-black/10 border-white/5"
                          )}>
                            {result.description}
                          </p>
                        )}
                        {result.qualities && result.qualities.length > 0 ? (
                          <div className="flex flex-col gap-4 w-full">
                            <div className={clsx("border-t pt-4 mt-1 transition-colors", isLight ? "border-neutral-200" : "border-white/10")}>
                              <span className="text-xs uppercase tracking-widest text-emerald-500 font-bold block mb-3">
                                Available Video Quality Formats:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {result.qualities.map((q, idx) => (
                                  <a
                                    key={idx}
                                    href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\s+/g, "_") + ".mp4"); }}
                                    
                                    className={clsx(
                                      "flex items-center justify-between p-3 rounded-xl transition-all border group/quality",
                                      isLight ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10"
                                    )}
                                  >
                                    <div className="flex flex-col text-left">
                                      <span className={clsx(
                                        "font-bold text-sm transition-colors",
                                        isLight ? "text-neutral-800 group-hover/quality:text-white" : "text-white group-hover/quality:text-white"
                                      )}>
                                        {q.label}
                                      </span>
                                      {q.size && (
                                        <span className={clsx(
                                          "text-xs transition-colors",
                                          isLight ? "text-neutral-500 group-hover/quality:text-white/80" : "text-neutral-400 group-hover/quality:text-white/80"
                                        )}>
                                          {q.size}
                                        </span>
                                      )}
                                    </div>
                                    <div className={clsx("p-2 rounded-lg transition-colors", isLight ? "bg-neutral-100 group-hover/quality:bg-white/20" : "bg-white/10 group-hover/quality:bg-white/20")}>
                                      <Download className="w-4 h-4 text-emerald-500 group-hover/quality:text-white" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                            {result.url && (
                              <div className={clsx("flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center mt-2 border-t pt-4 transition-colors w-full", isLight ? "border-neutral-200" : "border-white/5")}>
                                <a
                                  href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.url, (result.title || "download") + ".mp4"); }}
                                  
                                  className={clsx(
                                    "w-full sm:w-auto inline-flex items-center justify-center gap-2 border px-6 py-3 rounded-full font-bold transition-all uppercase tracking-wider text-xs cursor-pointer",
                                    isLight ? "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-900 hover:text-white" : "bg-white/10 hover:bg-white hover:text-black border-white/10 text-white"
                                  )}
                                >
                                  <Download className="w-4 h-4" /> Download Default File
                                </a>
                                <CopyButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                                <QRCodeButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                              </div>
                            )}
                          </div>
                        ) : result.url ? (
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center w-full">
                            <a
                              href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.url, (result.title || "download") + ".mp4"); }}
                              
                              className={clsx(
                                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer",
                                isLight ? "bg-neutral-950 text-white hover:bg-neutral-800" : "bg-white hover:bg-neutral-200 text-black"
                              )}
                            >
                              <Download className="w-5 h-5" /> Download Media File
                            </a>
                            <CopyButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm" />
                            <QRCodeButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className={clsx(
                  "border rounded-3xl p-6 flex items-start gap-4 backdrop-blur-sm shadow-xl transition-colors",
                  isLight ? "bg-red-50/70 border-red-200 text-red-600" : "bg-red-500/10 border border-red-500/20 text-red-400"
                )}>
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-lg mb-1">Extraction Failed</h4>
                    <p className={clsx(
                      "leading-relaxed text-sm font-medium transition-colors",
                      isLight ? "text-red-600/90" : "text-red-400/80"
                    )}>
                      {result.error || "The URL link is unsupported, private, or being blocked by the origin servers."}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer */}
      <div className="mt-auto pt-16 text-center relative z-10">
        <p className={clsx(
          "text-sm font-medium transition-colors",
          isLight ? "text-neutral-400" : "text-neutral-500"
        )}>
          all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
        </p>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxMediaList[lightboxIndex] && (() => {
          const activeItem = lightboxMediaList[lightboxIndex];
          const hasMultiple = lightboxMediaList.length > 1;

          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => {
              if (prev === null) return null;
              return (prev - 1 + lightboxMediaList.length) % lightboxMediaList.length;
            });
          };

          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => {
              if (prev === null) return null;
              return (prev + 1) % lightboxMediaList.length;
            });
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Top Navigation & Action Controls */}
              <div className="w-full flex items-center justify-between text-white z-10 py-2">
                <div className="flex flex-col max-w-[70%]">
                  <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                    {hasMultiple ? `Asset ${lightboxIndex + 1} of ${lightboxMediaList.length}` : 'High Resolution Asset Preview'}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold truncate text-white/90">
                    {activeItem.title || "Social Media Attachment"}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {/* Download Direct Link Button */}
                  <a
                    href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFileClientSide(activeItem.url, (activeItem.title || "download").slice(0, 30).trim() + "_preview.mp4"); }}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title="Download Media File"
                  >
                    <Download className="w-5 h-5" />
                  </a>

                  {/* Close Lightbox Button */}
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/25 hover:rotate-90 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Central Display Stage */}
              <div className="flex-1 w-full flex items-center justify-center relative">
                {/* Left Switch Button */}
                {hasMultiple && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/5 shadow-xl flex items-center justify-center backdrop-blur-sm group"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Media Component Body */}
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="max-w-full max-h-[75vh] flex items-center justify-center relative select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeItem.type === 'video' ? (
                    <video
                      src={getProxiedUrl(activeItem.url)}
                      controls
                      autoPlay
                      playsInline
                      className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5"
                    />
                  ) : (
                    <img
                      src={getProxiedUrl(activeItem.url)}
                      alt={activeItem.title || "Full Resolution Preview"}
                      className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                      }}
                    />
                  )}
                </motion.div>

                {/* Right Switch Button */}
                {hasMultiple && (
                  <button
                    onClick={handleNext}
                    className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/5 shadow-xl flex items-center justify-center backdrop-blur-sm group"
                  >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* Bottom Instructions Info */}
              <div className="py-2 text-center text-xs text-neutral-500 font-medium">
                {hasMultiple ? "Tip: Use Arrow Keys (← / →) or click outside to dismiss" : "Tip: Click outside or press ESC to dismiss"}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      
      {/* Global CSS Injectors for custom features */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scan {
          0% { transform: translateY(-10px); }
          50% { transform: translateY(195px); }
          100% { transform: translateY(-10px); }
        }
        .animate-scan {
          animation: scan 2.8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
