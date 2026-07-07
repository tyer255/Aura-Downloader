import React, { useState, useEffect } from 'react';
import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError, CookiePolicy } from './pages/StaticPages';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2, AlertCircle, CheckCircle2, Youtube, History, Download, Film, Music, Tv, MessageSquare, Image as ImageIcon, Instagram, Facebook, ListVideo, User, X, ChevronLeft, ChevronRight, Maximize2, Copy, Check, Sparkles, Sun, Moon, QrCode, Star, Trash2, Upload, ExternalLink, Filter, Calendar, Lock, Archive, Linkedin, Twitter } from 'lucide-react';
import { m as motion, LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { DownloadResult } from './types';
import clsx from 'clsx';

import { requestNotificationPermission, showNotification } from './lib/notifications';

const getProxiedUrl = (url?: string, inline = true) => {
  if (!url) return '/images/avatar_placeholder.png';
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // For Instagram/Facebook/TikTok/Reddit CDNs, always proxy to bypass client-side CORS/403 blocks/hotlink protections
  if (
    url.includes('instagram.com') || 
    url.includes('cdninstagram.com') || 
    url.includes('fbcdn.net') || 
    url.includes('tiktokcdn') || 
    url.includes('ttwstatic') || 
    url.includes('redd.it') || 
    url.includes('redditstatic') ||
    url.includes('twimg.com') ||
    url.includes('twitter.com') ||
    url.includes('licdn.com') ||
    url.includes('linkedin.com') ||
    url.includes('youtube.com') ||
    url.includes('ytimg.com') ||
    url.includes('ggpht.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('pinterest.com') ||
    url.includes('pinimg.com')
  ) {
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

type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin';

const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; }[] = [
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', title: 'Pinterest Downloader - Video & Image Saver', description: 'Download high-quality Pinterest images, videos, and GIFs for free. Our fast Pinterest downloader works on all devices without watermarks.' },
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', title: 'YouTube Downloader - Video & Audio Saver', description: 'Download YouTube videos and audio in HD quality. The fastest free YouTube video downloader for MP4 and MP3 formats.' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', title: 'Instagram Downloader - Save Photos & Videos', description: 'Download Instagram videos, photos, stories, IGTV and carousels for free. Fast and secure Instagram media saver.' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', title: 'TikTok Downloader - No Watermark Video Saver', description: 'Download TikTok videos without watermark. Fast, free HD TikTok video and MP3 audio downloader.' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', title: 'Facebook Video Downloader - Save FB Videos', description: 'Download Facebook videos and reels in high quality. Free and fast FB video saver.' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', title: 'Reddit Video Downloader - Save Videos with Audio', description: 'Download Reddit videos with sound and audio. Save Reddit images, GIFs, and media fast and free.' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'Paste X / Twitter Link Here', name: 'X / Twitter Downloader', title: 'X (Twitter) Video Downloader - Save Tweets', description: 'Download videos and GIFs from X (Twitter). Fast, free, and secure X media saver.' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'LinkedIn Video Downloader - Save LI Videos', description: 'Download LinkedIn videos, images, and documents. Save professional media from LinkedIn posts easily.' },
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
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
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
    case 'x':
      return {
        icon: <Twitter className="w-3.5 h-3.5" />,
        colorClass: 'text-neutral-800 dark:text-neutral-200',
        bgClass: 'bg-neutral-500/10 dark:bg-white/10',
        borderClass: 'border-neutral-500/20 dark:border-white/20'
      };
    case 'linkedin':
      return {
        icon: <Linkedin className="w-3.5 h-3.5" />,
        colorClass: 'text-sky-500',
        bgClass: 'bg-sky-500/10',
        borderClass: 'border-sky-500/20'
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
      const qrcodeLib = await import('qrcode');
      const dataUrl = await (qrcodeLib.default || qrcodeLib).toDataURL(url, {
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
                  <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 select-none rounded-lg"  loading="lazy" decoding="async" width="400" height="400" />
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

function DownloaderView({ routeTab }: { routeTab?: Tab }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(routeTab || 'pinterest');
  
  useEffect(() => {
    if (routeTab) setActiveTab(routeTab);
  }, [routeTab]);
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
  const [lightboxMediaList, setLightboxMediaList] = useState<{ url: string; type: "video" | "image"; title?: string; thumbnail?: string }[]>([]);

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

    requestNotificationPermission();

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
      requestNotificationPermission();
      setDownloadProgress(0);
      setHistoryToast("Starting download...");

      const fetchUrl = url.startsWith("/api/proxy-download") ? url : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
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
      showNotification("Download Complete", {
        body: `Successfully downloaded: ${filename}`,
        icon: '/vite.svg'
      });
    } catch (error) {
      console.error('Download setup failed:', error);
      setDownloadProgress(null);
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
      showNotification("Download Failed", {
        body: `Failed to download: ${filename}`,
        icon: '/vite.svg'
      });
    }
  };

  const handleDownloadAll = () => {
    if (!result || !result.media) return;
    result.media.forEach((item, index) => {
      setTimeout(() => {
        downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item_" + (index + 1) + (item.type === "video" ? ".mp4" : ".jpg"));
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
    <>
      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <LazyMotion features={domMax}>
    <div className={clsx(
        "min-h-screen bg-gradient-to-b flex flex-col items-center pt-8 pb-12 px-4 font-sans transition-colors duration-700",
      isLight ? "text-neutral-900 selection:bg-red-500/10" : "text-neutral-50 selection:bg-red-500/30",
      getBgGlow(activeTab)
    )}>
      
      {/* Top Header */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className={clsx(
          "flex items-center rounded-full pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 transition-colors border shrink-0",
          isLight ? "bg-white border-neutral-200 text-neutral-600" : "bg-white/5 border border-white/10 text-neutral-400"
        )}>
          <span className="text-xs sm:text-sm font-medium tracking-wide mr-2 sm:mr-3 uppercase whitespace-nowrap">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 whitespace-nowrap">
             <Youtube className="w-3 h-3 sm:w-4 sm:h-4" /> Subscribe
          </a>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer relative group",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10",
              isHistorySpinning && "animate-spin"
            )}
            title="Download History"
          >
            <History className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 blur-md transition-all"></div>
          </button>
        </div>
      </div>

      {/* Glassmorphic Sliding History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Ambient Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer"
            />
            
            {/* Premium History Slider Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] ultra-glass z-50 flex flex-col text-white"
            >
              <div className="ambient-highlight"></div>
              
              {/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative">
                {/* Subtle separator line */}
                <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
                
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                    <History className="w-5 h-5 text-white/90" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white/90">History</h2>
                    <p className="text-xs text-white/40 mt-0.5">{history.length} recent activities</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-20">
                  {/* Clear All Header Action */}
                  {history.length > 0 && (
                    <div className="relative">
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
                          className="px-3 py-1.5 rounded-full border text-[10px] font-black cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5 bg-white/5 border-white/10 text-white/80 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Close Button */}
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-white/40 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all p-2.5 rounded-full hover:rotate-90 duration-300 cursor-pointer"
                    title="Close Slider"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative z-10">
                {history.length === 0 ? (
                  <div className="px-6 py-4 flex-1 h-full flex flex-col items-center justify-center relative min-h-[350px]">
                    {/* Floating particles / abstract background elements for empty state */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-[50px] pointer-events-none" />

                    <div className="relative flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity duration-500">
                      {/* Glowing Empty Icon */}
                      <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-tr from-white/5 to-white/[0.02] border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] flex items-center justify-center relative group">
                        {/* Subtle pulsing glow */}
                        <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl animate-pulse" />
                        <Archive className="w-8 h-8 text-white/30 relative z-10" />
                      </div>
                      
                      <h3 className="text-base font-medium text-white/80 mb-1.5">No recent history</h3>
                      <p className="text-sm text-white/40 max-w-[220px] leading-relaxed">
                        Items you process or download will automatically appear here.
                      </p>
                    </div>
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
                          className="border rounded-2xl p-4.5 transition-all relative flex flex-col gap-3 group/item overflow-hidden bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10 shadow-lg shadow-black/30"
                          style={{
                            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.15)"
                          }}
                        >
                          {/* Card Top Header: Platform indicator & Close Button */}
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
                            <button aria-label="Close"
                              onClick={handleDelete}
                              className="p-1.5 rounded-full transition-colors cursor-pointer text-white/40 hover:text-red-400 hover:bg-white/5"
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
                                  navigate(item.platform === 'pinterest' ? '/' : `/${item.platform}-downloader`);
                              }
                              setShowHistory(false);
                            }}
                            className="text-left cursor-pointer flex-1 flex gap-3 mt-1 items-center"
                          >
                            {item.thumbnail && (
                              <div className="w-12 h-12 rounded-lg bg-neutral-950 shrink-0 overflow-hidden border border-white/10 shadow-sm relative group-hover/item:scale-105 transition-transform">
                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm line-clamp-1 transition-colors text-white/90 hover:text-white group-hover/item:underline decoration-white/30">
                                {item.appName ? `${item.appName} - ` : ''}{item.title}
                              </h4>
                              <p className="text-[11px] text-white/40 font-mono truncate mt-0.5 select-all">
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
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-white/60" />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </button>

                            {/* Load button */}
                            <button
                              onClick={() => {
                                handleUrlChange(item.url, item.platform);
                                if (item.platform) {
                                  navigate(item.platform === 'pinterest' ? '/' : `/${item.platform}-downloader`);
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
                    className="absolute bottom-20 left-6 right-6 z-40 bg-neutral-900 text-white text-[11px] font-bold py-3 px-4 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 backdrop-blur-md"
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
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white/10 text-center hover:scale-[1.01] active:scale-[0.99] bg-white/5 hover:bg-white/10 text-white"
                >
                  Close Slider
                </button>
              </div>

            </motion.div>
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
                    case 'x': return 'shadow-[0_0_15px_rgba(0,0,0,0.1)]';
                    case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.15)]';
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
                  case 'x': return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
                  case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.4)]';
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
                    aria-label="Social media post or media URL"
                    className={clsx(
                      "w-full bg-transparent text-base sm:text-lg placeholder-neutral-400 outline-none py-3 pr-20 transition-colors",
                      isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-500"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
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
                      <div className={clsx("h-32 sm:h-44 relative", isLight ? "bg-neutral-200" : "bg-neutral-800")}>
                        {result.profile.bannerUrl && (
                          <img 
                            src={getProxiedUrl(result.profile.bannerUrl)} 
                            alt="Cover Banner" 
                            className="w-full h-full object-cover cursor-zoom-in transition-opacity" 
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
                            
                            <img 
                              src={getProxiedUrl(result.profile.avatarUrl || result.thumbnail || "/images/avatar_placeholder.png")} 
                              alt="Profile DP" 
                              className={clsx(
                                "w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-[6px] relative z-10 shadow-2xl group-hover:scale-[1.03] transition-transform",
                                isLight ? "border-white" : "border-[#1e1516]"
                              )}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/avatar_placeholder.png';
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
                                  <img src={getProxiedUrl(result.profile.avatarUrl)} alt="Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" width="400" height="400" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Profile Logo</h4>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>High-resolution avatar image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                <button type="button"                                   onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.avatarUrl!, (result.profile?.username || "user") + "_avatar.jpg"); }}
                                  className={clsx(
                                    "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5",
                                    isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
                                  )}
                                >
                                  <Download className="w-5 h-5" /> Download Logo
                                </button>
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
                                <div className="w-full rounded-2xl overflow-hidden shrink-0 border-[6px] border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-neutral-100/50 backdrop-blur-sm relative group">
                                  <img src={getProxiedUrl(result.profile.bannerUrl)} alt="Banner" className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Cover Banner</h4>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>Full-width background image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                <button type="button"                                   onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.bannerUrl!, (result.profile?.username || "user") + "_banner.jpg"); }}
                                  className={clsx(
                                    "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5",
                                    isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
                                  )}
                                >
                                  <Download className="w-5 h-5" /> Download Banner
                                </button>
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
                                    <img src={getProxiedUrl(item.thumbnail)} alt={`Video slide ${index + 1}`} className="w-full h-full object-cover opacity-80"  loading="lazy" decoding="async" width="400" height="400" />
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
                                  <button type="button"                                     onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + (item.type === "video" ? "_item.mp4" : "_item.jpg")); }}
                                  className={clsx(
                                    "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                                      isLight ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10"
                                    )}
                                  >
                                    <Download className="w-4 h-4" /> Download Video
                                  </button>
                                </div>
                              ) : (
                                <button type="button"                                   onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + (item.type === "video" ? "_item.mp4" : "_item.jpg")); }}
                                  className={clsx(
                                    "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                                    isLight ? "bg-white hover:bg-neutral-900 hover:text-white border-neutral-200 text-neutral-800" : "bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white"
                                  )}
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Image
                                </button>
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
                              title: result.title || "Ready File Asset",
                              thumbnail: result.thumbnail
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
                                title: result.title || "Ready File Asset",
                                thumbnail: result.thumbnail
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
                                  <button type="button"                                     key={idx}
                                    onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\s+/g, "_") + "." + (q.ext || "mp4")); }}
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
                                  </button>
                                ))}
                              </div>
                            </div>
                            {result.url && (
                              <div className={clsx("flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center mt-2 border-t pt-4 transition-colors w-full", isLight ? "border-neutral-200" : "border-white/5")}>
                                <CopyButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                                <QRCodeButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                              </div>
                            )}
                          </div>
                        ) : result.url ? (
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center w-full">
                            <button type="button"                               onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.url, (result.title || "download") + (result.mediaType === "image" ? ".jpg" : ".mp4")); }}
                              
                              className={clsx(
                                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer",
                                isLight ? "bg-neutral-950 text-white hover:bg-neutral-800" : "bg-white hover:bg-neutral-200 text-black"
                              )}
                            >
                              <Download className="w-5 h-5" /> Download Media File
                            </button>
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
                      "leading-relaxed text-sm font-medium transition-colors mb-4",
                      isLight ? "text-red-600/90" : "text-red-400/80"
                    )}>
                      {result.error || "The URL link is unsupported, private, or being blocked by the origin servers."}
                    </p>
                    {(result.thumbnail || result.title) && (
                      <div className={clsx(
                        "mt-4 p-4 rounded-xl border flex gap-4 items-center bg-black/20",
                        isLight ? "border-red-200" : "border-red-500/20"
                      )}>
                        {result.thumbnail && (
                          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10">
                            <img src={getProxiedUrl(result.thumbnail)} alt="Thumbnail" className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Recovered Metadata</p>
                          {result.title && <p className="text-sm font-semibold line-clamp-2">{result.title}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer */}
      <footer className="mt-auto pt-20 pb-10 w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className={clsx(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 mb-10 py-10 border-y", 
          isLight ? "border-neutral-200/60" : "border-white/10"
        )}>
          {TABS.map((tab) => (
            <Link 
              key={tab.id} 
              to={`/${tab.id}-downloader`}
              className={clsx(
                "flex items-center justify-center sm:justify-start px-2 py-1 text-sm font-medium transition-colors hover:-translate-y-0.5 transform duration-200 text-center sm:text-left leading-relaxed",
                isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm font-medium leading-loose text-center max-w-3xl mx-auto">
            <Link to="/about" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>About</Link>
            <Link to="/contact" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Contact</Link>
            <Link to="/faq" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>FAQ</Link>
            <Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>
            <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Cookie Policy</Link>
            <Link to="/terms" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Terms & Conditions</Link>
            <Link to="/dmca" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>DMCA</Link>
          </div>
          <p className={clsx(
            "text-sm font-medium transition-colors text-center mt-2 leading-relaxed px-4",
            isLight ? "text-neutral-500" : "text-neutral-500"
          )}>
            all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
          </p>
        </div>
      </footer>

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
                  <button type="button"                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFileClientSide(activeItem.url, (activeItem.title || "download").slice(0, 30).trim() + "_preview" + (activeItem.type === "video" ? ".mp4" : ".jpg")); }}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title="Download Media File"
                  >
                    <Download className="w-5 h-5" />
                  </button>

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
                  <button aria-label="Previous"
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
                      poster={activeItem.thumbnail ? getProxiedUrl(activeItem.thumbnail) : undefined}
                      controls
                      autoPlay
                      playsInline
                      className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5"
                    />
                  ) : (
                    <img                       src={getProxiedUrl(activeItem.url)}
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
                  <button aria-label="Next"
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
        .ultra-glass {
          background: linear-gradient(145deg, rgba(20, 20, 24, 0.65) 0%, rgba(10, 10, 12, 0.85) 100%);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow: 
            -30px 0 60px rgba(0, 0, 0, 0.7), 
            inset 1px 1px 0px rgba(255, 255, 255, 0.08),
            inset -1px -1px 0px rgba(255, 255, 255, 0.02);
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }
        .ambient-highlight {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
          z-index: 10;
        }
      `}} />
    </div>
    </LazyMotion>
    </>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="/youtube-downloader" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/pinterest-downloader" element={<DownloaderView routeTab="pinterest" />} />
      
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/dmca" element={<DMCA />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
