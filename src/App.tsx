import confetti from "canvas-confetti";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, Download, AlertCircle, Image as ImageIcon, Film, Youtube, Image as LucideImage, History, X, Smartphone, Music, Video, Copy, Check } from "lucide-react";

type TabType = "pinterest" | "yt-media" | "yt-channel" | "ig-media" | "fb-media" | "tt-media" | "tw-media" | "yt-playlist" | "reddit-media";
type MediaType = "video" | "image" | "carousel" | "photo" | "audio" | "playlist" | "channel";

const getTabLabel = (tab: TabType) => {
  switch (tab) {
    case "pinterest": return "Pinterest";
    case "yt-media": return "YouTube Media";
    case "yt-channel": return "YouTube Channel";
    case "ig-media": return "Instagram";
    case "fb-media": return "Facebook";
    case "tt-media": return "TikTok";
    case "tw-media": return "Twitter / X";
    case "yt-playlist": return "YT Playlist";
    case "reddit-media": return "Reddit";
    default: return tab;
  }
};

interface SearchHistoryItem {
  url: string;
  tab: TabType;
  title?: string;
  timestamp: number;
}

interface FetchResponse {
  success: boolean;
  type?: MediaType; 
  media_type?: "video" | "photo" | "video_formats"; 
  thumbnail?: string; 
  thumbnail_url?: string; 
  mediaUrls?: string[]; 
  download_url?: string; 
  formats?: {quality: string, type: string, url: string}[]; 
  dp_url?: string; 
  banner_url?: string; 
  posts?: {id: string, text: string, images: string[]}[];
  error?: string;
  message?: string;
  username?: string;
  title?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("pinterest");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FetchResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [fetchTimeRemaining, setFetchTimeRemaining] = useState<number>(15);
  const [fetchIntervalId, setFetchIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("searchHistory");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const urlRef = useRef(url);
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  useEffect(() => {
    if (!url) return;
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      if (hostname.includes('pinterest.com') || hostname.includes('pin.it')) {
        setActiveTab('pinterest');
      } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
         if (parsedUrl.pathname.includes('/playlist') || parsedUrl.searchParams.has('list')) {
           setActiveTab('yt-playlist');
         } else if (parsedUrl.pathname.startsWith('/@') || parsedUrl.pathname.startsWith('/c/') || parsedUrl.pathname.startsWith('/channel/') || parsedUrl.pathname.startsWith('/user/')) {
           setActiveTab('yt-channel');
         } else {
           setActiveTab('yt-media');
         }
      } else if (hostname.includes('instagram.com')) {
        setActiveTab('ig-media');
      } else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
        setActiveTab('fb-media');
      } else if (hostname.includes('tiktok.com')) {
        setActiveTab('tt-media');
      } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        setActiveTab('tw-media');
      } else if (hostname.includes('reddit.com')) {
        setActiveTab('reddit-media');
      }
    } catch (e) {
      // Not a valid URL yet, do nothing
    }
  }, [url]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const addToHistory = (searchUrl: string, searchTab: TabType, title?: string) => {
    setHistory(prev => {
      const newItem = { url: searchUrl, tab: searchTab, title, timestamp: Date.now() };
      const filtered = prev.filter(item => item.url !== searchUrl);
      const next = [newItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("searchHistory", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save search history", e);
      }
      return next;
    });
  };

  const removeFromHistory = (searchUrl: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item.url !== searchUrl);
      try {
        localStorage.setItem("searchHistory", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to update search history", e);
      }
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("searchHistory");
    } catch (e) {
      console.error("Failed to clear search history", e);
    }
  };

  const handleCopy = (e: React.MouseEvent, urlToCopy: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopiedUrl(urlToCopy);
      setTimeout(() => setCopiedUrl(null), 2000);
    }).catch(err => {
      console.error("Failed to copy", err);
    });
  };

  const proxyUrl = (u: string) => u ? `/api/proxy?url=${encodeURIComponent(u)}` : undefined;

  const isValidPinterestUrl = (link: string) => {
    return link.includes("pinterest.com") || link.includes("pin.it");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setUrl("");
    setError("");
    setResult(null);
  };

  const executeSearch = async (targetUrl: string, targetTab: TabType) => {
    setError("");
    setResult(null);

    if (!targetUrl.trim()) {
      setError("Please enter a link.");
      return;
    }

    if (targetTab === "pinterest" && !isValidPinterestUrl(targetUrl)) {
      setError("Please enter a valid Pinterest link.");
      return;
    }

    if (targetTab === "ig-media" && !targetUrl.includes("instagram.com")) {
      setError("Please enter a valid Instagram link.");
      return;
    }

    if (targetTab === "yt-media" && !targetUrl.includes("youtube.com") && !targetUrl.includes("youtu.be")) {
      setError("Please enter a valid YouTube link.");
      return;
    }

    if (targetTab === "yt-channel" && !targetUrl.includes("youtube.com/@")) {
      setError("Please enter a valid YouTube channel link (e.g. youtube.com/@username).");
      return;
    }

    setLoading(true);
    setFetchProgress(0);
    setFetchTimeRemaining(15);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let newProgress = Math.min(95, Math.floor((elapsed / 15) * 100));
      let newTime = Math.max(1, 15 - Math.floor(elapsed));
      setFetchProgress(newProgress);
      setFetchTimeRemaining(newTime);
    }, 500);
    setFetchIntervalId(interval);

    let endpoint = "";
    if (targetTab === "pinterest") endpoint = "/api/fetch-pinterest";
    else if (targetTab === "yt-channel") endpoint = "/api/yt-channel";
    else if (targetTab === "yt-media") endpoint = "/api/yt-media";
    else if (targetTab === "ig-media") endpoint = "/api/ig-media";
    else if (targetTab === "fb-media") endpoint = "/api/fetch-facebook";
    else if (targetTab === "tt-media") endpoint = "/api/fetch-tiktok";
    else if (targetTab === "tw-media") endpoint = "/api/fetch-twitter";
    else if (targetTab === "yt-playlist") endpoint = "/api/yt-playlist";
    else if (targetTab === "reddit-media") endpoint = "/api/universal-dl";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || data.message || "Failed to fetch media.");
      } else {
        setFetchProgress(100);
        setFetchTimeRemaining(0);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#0ea5e9']
        });
        setResult(data);
        addToHistory(targetUrl, targetTab, data.title);
      }
    } catch (err) {
      console.error("Error during fetch:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      if (interval) clearInterval(interval);
      setFetchIntervalId(null);
      // Let the 100% show for a brief moment before removing the loading state
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(url, activeTab);
  };

  const handleDownload = async (mediaUrl: string, fileName?: string) => {
    try {
      setDownloading(true);
      setDownloadProgress(0);
      const downloadUrl = `/api/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(fileName || "media-download")}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
         // Fallback to direct download via browser if fetch/proxy fails
         throw new Error("Download failed via API");
      }
      
      const reader = response.body?.getReader();
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : null;
      let loaded = 0;
      
      if (!reader) {
        const blob = await response.blob();
        downloadBlob(blob, fileName);
        return;
      }

      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          } else {
            setDownloadProgress(-1); // Indeterminate progress
          }
        }
      }
      
      const blob = new Blob(chunks);
      downloadBlob(blob, fileName);

    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      const anchor = document.createElement("a");
      anchor.href = `/api/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(fileName || "media-download")}`;
      anchor.target = "_blank";
      anchor.download = fileName || "media-download";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const downloadBlob = (blob: Blob, fileName?: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName || "media-download";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
  };

  const getAmbientColor = (tab: TabType) => {
    switch (tab) {
      case "pinterest": return "bg-red-500/20";
      case "yt-media": return "bg-red-600/20";
      case "yt-channel": return "bg-red-800/20";
      case "ig-media": return "bg-pink-500/20";
      case "fb-media": return "bg-blue-600/20";
      case "tt-media": return "bg-teal-500/20";
      case "tw-media": return "bg-sky-400/20";
      case "yt-playlist": return "bg-yellow-500/20";
      case "reddit-media": return "bg-orange-500/20";
      default: return "bg-white/10";
    }
  };

  return (
    <div className="min-h-screen relative bg-[#0a0a0a] text-white flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 selection:bg-white/20 overflow-x-hidden">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] ${getAmbientColor(activeTab)} rounded-full blur-[120px] opacity-60 transition-colors duration-1000`} />
      </div>

      {/* Search History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#0a0a0a] border-l border-white/10 z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2 text-white/90">
                  <History className="w-5 h-5" />
                  <h2 className="text-lg font-medium tracking-wide">Recent Searches</h2>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors font-medium border border-white/5"
                    >
                      Clear All
                    </button>
                  )}
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="text-center text-white/40 mt-12 text-sm">
                  No recent searches found.
                </div>
              ) : (
                <div className="flex flex-col space-y-8">
                  {Object.entries(
                    history.reduce((acc, item) => {
                      const label = getTabLabel(item.tab);
                      if (!acc[label]) acc[label] = [];
                      acc[label].push(item);
                      return acc;
                    }, {} as Record<string, typeof history>)
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md pb-2 z-10">{category}</h3>
                      {items.map((item, idx) => (
                        <div 
                          key={`${item.url}-${item.timestamp}-${idx}`}
                          className="group flex flex-col p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer"
                          onClick={() => {
                            setActiveTab(item.tab);
                            setUrl(item.url);
                            setShowHistory(false);
                            executeSearch(item.url, item.tab);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium tracking-wider text-white/40">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleCopy(e, item.url)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                title="Copy Link"
                              >
                                {copiedUrl === item.url ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromHistory(item.url);
                                }}
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {item.title && (
                            <span className="text-sm font-medium text-white/90 truncate w-full mb-1">{item.title}</span>
                          )}
                          <span className="text-xs text-white/50 truncate w-full mb-3">{item.url}</span>
                          <button
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveTab(item.tab);
                               setUrl(item.url);
                               setShowHistory(false);
                               executeSearch(item.url, item.tab);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors mt-auto"
                          >
                             <Download className="w-3.5 h-3.5" />
                             Download Again
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Left Support Button */}
      <div className="absolute top-6 left-4 sm:left-6 z-30 flex items-center gap-2 sm:gap-3 backdrop-blur-sm bg-black/20 p-1.5 pr-2 rounded-full border border-white/5">
        <span className="text-white/60 text-xs sm:text-sm font-medium pl-2 sm:pl-3">SUPPORT =</span>
        <a 
          href="https://youtube.com/@mridulgaming-_-official-800?si=cyOe09O4c_wJ_tPN" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FF0000] text-white hover:bg-[#FF0000]/90 border border-[#FF0000]/50 hover:border-white/20 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] hover:scale-105 active:scale-95"
        >
          <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm tracking-wide">Subscribe</span>
        </a>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-6 right-4 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 border border-white/20 rounded-full font-medium transition-all shadow-lg shadow-white/10"
            title="Install App"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-sm">Install App</span>
          </button>
        )}
        <button
          onClick={() => setShowHistory(true)}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md shadow-lg"
          title="Search History"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* Background ambient effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-4xl relative z-10 flex flex-col items-center px-4 sm:px-6">
        
        {/* Tabs */}
        <div className="w-full mb-8 z-30 sticky top-4 px-4">
          <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 -mb-2 flex justify-start sm:justify-center">
            <div className="flex flex-nowrap items-center gap-2 min-w-max p-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full shadow-2xl">
              <button
                onClick={() => handleTabChange("pinterest")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "pinterest" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Pinterest
              </button>
              <button
                onClick={() => handleTabChange("yt-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "yt-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                YT Media
              </button>
              <button
                onClick={() => handleTabChange("yt-channel")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "yt-channel" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                YT Channel
              </button>
              <button
                onClick={() => handleTabChange("ig-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "ig-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Instagram
              </button>
              <button
                onClick={() => handleTabChange("fb-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "fb-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Facebook
              </button>
              <button
                onClick={() => handleTabChange("tt-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "tt-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                TikTok
              </button>
              <button
                onClick={() => handleTabChange("tw-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "tw-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Twitter/X
              </button>
              <button
                onClick={() => handleTabChange("reddit-media")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "reddit-media" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Reddit
              </button>
              <button
                onClick={() => handleTabChange("yt-playlist")}
                className={`px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium transition-all ${
                  activeTab === "yt-playlist" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                YT Playlist
              </button>
            </div>
          </div>
        </div>

        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 px-4"
        >
          <div className="inline-flex items-center justify-center space-x-2 mb-4 bg-white/5 border border-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/80 whitespace-normal text-center">
            <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${activeTab === 'pinterest' ? 'bg-red-500' : activeTab === 'ig-media' ? 'bg-pink-500' : activeTab === 'fb-media' ? 'bg-blue-600' : activeTab === 'tt-media' ? 'bg-black' : activeTab === 'tw-media' ? 'bg-blue-400' : activeTab === 'yt-playlist' ? 'bg-yellow-500' : activeTab === 'reddit-media' ? 'bg-orange-500' : 'bg-red-600'}`} />
            <span>{activeTab === 'pinterest' ? 'Pinterest Downloader' : activeTab === 'yt-media' ? 'YouTube Downloader' : activeTab === 'ig-media' ? 'Instagram Downloader' : activeTab === 'fb-media' ? 'Facebook Downloader' : activeTab === 'tt-media' ? 'TikTok Downloader' : activeTab === 'tw-media' ? 'Twitter Downloader' : activeTab === 'yt-playlist' ? 'YouTube Playlist Downloader' : activeTab === 'reddit-media' ? 'Reddit Downloader' : 'YouTube Channel Extractor'}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            {activeTab === 'pinterest' ? 'Download Anything.' : activeTab === 'yt-media' ? 'Get YT Media.' : activeTab === 'ig-media' ? 'Get IG Media.' : activeTab === 'fb-media' ? 'Get FB Media.' : activeTab === 'tt-media' ? 'Get TT Media.' : activeTab === 'tw-media' ? 'Get X Media.' : activeTab === 'yt-playlist' ? 'Get Playlists.' : activeTab === 'reddit-media' ? 'Get Reddit Media.' : 'Extract Banners.'}
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto font-light">
            {activeTab === 'pinterest' ? 'High-quality videos, images, and carousels. Just paste the link and let the engine do the rest.' : 
             activeTab === 'yt-media' ? 'Download YouTube Videos and Shorts.' : 
             activeTab === 'ig-media' ? 'Download Instagram Reels, Posts, and DP.' :
             activeTab === 'fb-media' ? 'Download Facebook Reels and Videos seamlessly.' : 
             activeTab === 'tt-media' ? 'Download TikTok Videos without watermarks.' : 
             activeTab === 'tw-media' ? 'Download Twitter / X Videos and Photos seamlessly.' : 
             activeTab === 'yt-playlist' ? 'Extract all videos from a YouTube Playlist to download them individually without zipped files.' :
             activeTab === 'reddit-media' ? 'Download Reddit Videos and GIFs with audio intact.' :
             'Extract Profile Pictures and Channel Banners directly from any YouTube channel link.'}
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl transition-all duration-500 group-hover:bg-white/20 group-hover:blur-2xl" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-2 transition-all duration-500 focus-within:border-white/40 focus-within:bg-white/15 shadow-[0_8px_32px_rgba(255,255,255,0.1)] focus-within:shadow-[0_8px_40px_rgba(255,255,255,0.2)]">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  activeTab === 'pinterest' ? "Paste Pinterest Link Here" : 
                  activeTab === 'yt-media' ? "Paste YouTube Video/Short Link Here" : 
                  activeTab === 'ig-media' ? "Paste Instagram Reel/Post/Profile Link Here" :
                  "Paste YouTube Channel Link Here (@username)"
                }
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-lg font-light w-full focus:ring-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-black hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 rounded-[1.5rem] font-medium flex items-center justify-center space-x-2 shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Search</span>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-6 flex items-center justify-center space-x-2 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl backdrop-blur-md"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search History removed to slide-out drawer */}
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full mt-16 max-w-md mx-auto flex flex-col items-center space-y-6 px-4"
            >
              {/* Skeleton Image/Video Box */}
              <div className="w-full aspect-square sm:aspect-video rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl">
                <motion.div 
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full space-y-3 mt-4">
                <div className="flex justify-between text-xs text-white/70 font-medium">
                  <span>Processing request...</span>
                  <span>{fetchProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden relative shadow-inner">
                  <motion.div 
                    className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${fetchProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                  />
                </div>
                <div className="text-center text-xs text-white/50 font-medium animate-pulse">
                  {fetchProgress === 100 ? "Finalizing details..." : `~${fetchTimeRemaining}s remaining`}
                </div>
              </div>
              
              <p className="text-white/40 text-sm font-light tracking-wide pt-2">
                {activeTab === 'yt-channel' ? 'Analyzing Channel...' : 
                 'Processing Link...'}
              </p>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(5px)" }}
              transition={{ 
                duration: 0.8, 
                delay: 0.1, 
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                bounce: 0.3
              }}
              className="w-full mt-16 flex flex-col items-center px-4"
            >
              
              {/* Video Result */}
              {result.type === "video" && (result.thumbnail || result.thumbnail_url) && (result.mediaUrls?.[0] || result.download_url) && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-full max-w-md flex flex-col items-center space-y-6"
                >
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 aspect-[3/4] w-full">
                    <img 
                      src={proxyUrl(result.thumbnail || result.thumbnail_url || '')} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button 
                      onClick={() => handleDownload((result.thumbnail || result.thumbnail_url)!, "thumbnail.jpg")}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>Download Thumbnail</span>
                    </button>
                    <button 
                      onClick={() => handleDownload((result.mediaUrls?.[0] || result.download_url)!, "video.mp4")}
                      className="flex-1 bg-white text-black hover:bg-white/90 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Video</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Single Image Result */}
              {result.type === "image" && (result.mediaUrls?.[0] || result.download_url) && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-full max-w-md flex flex-col items-center space-y-6"
                >
                   <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 aspect-[3/4] w-full">
                    <img 
                      src={proxyUrl(result.mediaUrls?.[0] || result.download_url || '')} 
                      alt="Single image" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <button 
                    onClick={() => handleDownload((result.mediaUrls?.[0] || result.download_url)!, "image.jpg")}
                    className="w-full bg-white text-black hover:bg-white/90 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Image</span>
                  </button>
                </motion.div>
              )}

              {/* Carousel Result */}
              {result.type === "carousel" && result.mediaUrls && (
                <div className="w-full max-w-5xl">
                   <div className="flex items-center justify-between mb-8 px-4">
                     <h3 className="text-xl font-medium text-white/90">Carousel Images ({result.mediaUrls.length})</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.mediaUrls.map((url, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx, duration: 0.5, ease: "easeOut" }}
                        key={idx} 
                        className="flex flex-col space-y-4"
                      >
                         <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/50 aspect-[3/4] w-full">
                          <img 
                            src={proxyUrl(url)} 
                            alt={`Carousel item ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <button 
                          onClick={() => handleDownload(url, `image-${idx + 1}.jpg`)}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Image</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* YT Media Result (Video / Photo / Formats) */}
              {(result.media_type === "video" || result.media_type === "photo" || result.media_type === "video_formats") && (result.download_url || result.formats) && (
                <div className="w-full max-w-md flex flex-col items-center space-y-6">
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black w-full flex justify-center items-center">
                    <img 
                      src={result.thumbnail_url ? proxyUrl(result.thumbnail_url) : 'https://placehold.co/600x400/1a1a1a/444444?text=Thumbnail+Unavailable'} 
                      alt="YouTube media thumbnail" 
                      className="w-full max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-105 opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a1a1a/444444?text=Thumbnail+Unavailable';
                      }}
                    />
                    {(result.media_type === "video" || result.media_type === "video_formats") && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-[#FF0000] shadow-[0_0_20px_rgba(255,0,0,0.5)] flex items-center justify-center">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full flex flex-col gap-4">
                    {result.title && (
                      <h3 className="text-white/90 font-medium text-lg text-center px-4 leading-tight">
                        {result.title}
                      </h3>
                    )}
                    
                    {result.message && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center leading-relaxed">
                        {result.message}
                      </div>
                    )}

                    {result.thumbnail_url && (
                      <button 
                        onClick={() => handleDownload(result.thumbnail_url!, "youtube-thumbnail.jpg")}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span>Download Thumbnail</span>
                      </button>
                    )}
                    
                    {/* Backward compat for old media type */}
                    {result.download_url && result.media_type !== "video_formats" && (!result.formats || result.formats.length === 0) && !result.message && (
                      <button 
                        onClick={() => handleDownload(result.download_url!, result.media_type === "video" ? "youtube-video.mp4" : "youtube-photo.jpg")}
                        className="w-full bg-white text-black hover:bg-white/90 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download {result.media_type === "video" ? "Video" : "Photo"}</span>
                      </button>
                    )}

                    {/* Formats rendering */}
                    {result.formats && result.formats.length > 0 && (
                      <div className="w-full flex flex-col gap-3 mt-2">
                         <div className="w-full grid grid-cols-1 gap-3">
                           {result.formats.map((fmt, idx) => {
                             const isHighQuality = fmt.type === "video" && (fmt.quality.includes("1080") || fmt.quality.includes("720") || fmt.quality.includes("4K"));
                             return (
                               <button 
                                 key={idx}
                                 onClick={() => handleDownload(fmt.url, fmt.type === "audio" ? "youtube-audio.mp3" : "youtube-video.mp4")}
                                 className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium flex items-center justify-between transition-all overflow-hidden ${fmt.type === "audio" ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-white hover:bg-white/90 text-black shadow-lg hover:shadow-xl'}`}
                               >
                                 <div className="flex items-center space-x-2 sm:space-x-3">
                                   <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${isHighQuality ? 'text-blue-600' : ''} shrink-0`} />
                                   <span className="text-sm sm:text-base text-left flex flex-wrap items-center gap-1">
                                     <span>Download {fmt.type === "audio" ? "Audio" : "Video"}</span>
                                     <span className="font-bold opacity-80">({fmt.quality})</span>
                                   </span>
                                 </div>
                                 {isHighQuality && (
                                   <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-md shrink-0 ml-2">HQ</span>
                                 )}
                               </button>
                             );
                           })}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Channel / Profile Result */}
              {(result.dp_url || result.banner_url) && (
                <div className="w-full max-w-3xl flex flex-col items-center space-y-12">
                  {result.banner_url && (
                    <div className="w-full flex flex-col items-center space-y-4">
                      <h3 className="text-xl font-medium text-white/90 self-start">Channel Banner</h3>
                      <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 aspect-[16/3] w-full">
                        <img 
                          src={proxyUrl(result.banner_url || '')} 
                          alt="Channel Banner" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <button 
                        onClick={() => handleDownload(result.banner_url!, "banner.jpg")}
                        className="w-full bg-white text-black hover:bg-white/90 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download Banner</span>
                      </button>
                    </div>
                  )}

                  {result.dp_url && (
                    <div className="w-full flex flex-col items-center space-y-4 max-w-sm mx-auto">
                      <h3 className="text-xl font-medium text-white/90">Profile Picture {result.username ? `(@${result.username})` : ''}</h3>
                      <div className="relative group rounded-full overflow-hidden border border-white/10 shadow-2xl bg-black/50 aspect-square w-48 h-48 mx-auto">
                        <img 
                          src={proxyUrl(result.dp_url || '')} 
                          alt="Profile Picture" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <button 
                        onClick={() => handleDownload(result.dp_url!, "dp.jpg")}
                        className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download DP</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Playlist Result */}
              {result.type === "playlist" && result.playlistItems && (
                <div className="w-full max-w-3xl flex flex-col items-center space-y-6">
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl text-left">
                    <h3 className="text-xl font-semibold text-white/90 mb-2">Playlist: {result.title}</h3>
                    <p className="text-sm text-white/60 mb-6">{result.playlistItems.length} items found</p>
                    <div className="space-y-3">
                      {result.playlistItems.map((item: any, idx: number) => (
                         <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 transition-colors">
                           <div className="flex items-center space-x-3 overflow-hidden">
                             <div className="text-white/40 font-mono text-sm w-6">{idx + 1}</div>
                             <div className="truncate pr-4">
                               <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
                               <p className="text-xs text-white/50">{item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'}</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => {
                               // Quick set to yt-media and search
                               setTargetUrl(item.url);
                               handleTabChange('yt-media');
                             }}
                             className="shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all"
                             title="Load this video"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Community Posts Result */}
              {result.posts && result.posts.length > 0 && (
                <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
                  <h3 className="text-xl font-medium text-white/90 self-start">Community Posts</h3>
                  {result.posts.map((post, idx) => (
                    <div key={post.id || idx} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col space-y-4 shadow-xl">
                      {post.text && (
                        <div className="text-white/80 whitespace-pre-wrap font-light text-sm sm:text-base leading-relaxed">
                          {post.text}
                        </div>
                      )}
                      
                      {post.images && post.images.length > 0 && (
                        <div className={`grid gap-4 mt-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} className="flex flex-col space-y-3">
                              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40 group">
                                <img 
                                  src={proxyUrl(imgUrl)} 
                                  alt={`Post Attachment ${imgIdx + 1}`}
                                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                              <button 
                                onClick={() => handleDownload(imgUrl, `community-post-${post.id || idx}-${imgIdx + 1}.jpg`)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all text-sm"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Download Progress Overlay */}
      <AnimatePresence>
        {downloading && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-white flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                <span>Downloading Media...</span>
              </span>
              <span className="text-xs text-white/50 font-mono">
                {downloadProgress === -1 || downloadProgress === null ? 'Fetching...' : `${downloadProgress}%`}
              </span>
            </div>
            
            <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
              {downloadProgress === -1 || downloadProgress === null ? (
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-white/40 w-1/2 rounded-full"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              ) : (
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-white/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-auto pt-16 pb-8 text-center text-white/40 text-xs sm:text-sm font-light tracking-wide w-full">
        all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
      </footer>
    </div>
  );
}
