import React, { useEffect, useState, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function ReloadPrompt({ isLight }: { isLight: boolean }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const initialBuildIdRef = useRef<string | null>(null);
  const initialScriptsRef = useRef<string[]>([]);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 1. Service Worker PWA integration
  const {
    needRefresh: [swNeedRefresh, setSwNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        try {
          r.update()?.catch?.(() => {});
        } catch (e) {}

        setInterval(() => {
          try {
            r.update()?.catch?.(() => {});
          } catch (e) {}
        }, 15000); // Check SW every 15s
        
        window.addEventListener('focus', () => {
          try {
            r.update()?.catch?.(() => {});
          } catch (e) {}
        });
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Sync SW refresh state
  useEffect(() => {
    if (swNeedRefresh) {
      setUpdateAvailable(true);
      notifyOtherTabs();
    }
  }, [swNeedRefresh]);

  // Broadcast update to other open tabs
  const notifyOtherTabs = () => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'AURA_UPDATE_AVAILABLE' });
      }
      localStorage.setItem('aura_update_timestamp', Date.now().toString());
    } catch (e) {}
  };

  // Helper to trigger update flag
  const triggerUpdateAvailable = () => {
    setUpdateAvailable(true);
    setIsDismissed(false);
    notifyOtherTabs();
    
    // Send browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🚀 New Update Available!', {
          body: 'A new version of AURA Downloader is live. Click Refresh Now to apply the update.',
          icon: '/icon-192.png'
        });
      } catch (e) {}
    }
  };

  // Check version against backend API
  const checkServerVersion = async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-store, no-cache' }
      });
      if (!res.ok) return;
      const data = await res.json();
      
      if (data && data.buildId) {
        if (!initialBuildIdRef.current) {
          initialBuildIdRef.current = data.buildId;
        } else if (initialBuildIdRef.current !== data.buildId) {
          console.log(`[UpdateDetector] Build ID changed from ${initialBuildIdRef.current} to ${data.buildId}`);
          triggerUpdateAvailable();
        }
      }
    } catch (e) {
      // Ignore network errors during polling
    }
  };

  // Check HTML bundle script tags
  const checkHtmlScriptTags = async () => {
    try {
      const res = await fetch(`/?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-store, no-cache' }
      });
      if (!res.ok) return;
      const htmlText = await res.text();
      
      // Extract script src attributes
      const scriptMatches = htmlText.match(/src="\/src\/[^"]+"/g) || htmlText.match(/src="\/assets\/[^"]+"/g) || [];
      if (initialScriptsRef.current.length === 0) {
        initialScriptsRef.current = scriptMatches;
      } else if (scriptMatches.length > 0) {
        const scriptsChanged = scriptMatches.some(s => !initialScriptsRef.current.includes(s)) ||
                               initialScriptsRef.current.some(s => !scriptMatches.includes(s));
        if (scriptsChanged) {
          console.log('[UpdateDetector] Script bundle hashes changed in index.html');
          triggerUpdateAvailable();
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    // 2. Setup Broadcast Channel for multi-tab synchronization
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('aura_app_update_channel');
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === 'AURA_UPDATE_AVAILABLE') {
            setUpdateAvailable(true);
            setIsDismissed(false);
          }
        };
      } catch (e) {}
    }

    // Storage event for fallback multi-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_update_timestamp' && e.newValue) {
        setUpdateAvailable(true);
        setIsDismissed(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Initial check
    checkServerVersion();
    checkHtmlScriptTags();

    // Fast polling interval (every 6 seconds)
    const interval = setInterval(() => {
      checkServerVersion();
      checkHtmlScriptTags();
    }, 6000);

    // Check on tab focus / visibility change / reconnect
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
        checkHtmlScriptTags();
      }
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    window.addEventListener('online', handleFocusOrVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      window.removeEventListener('online', handleFocusOrVisibility);
      if (broadcastChannelRef.current) {
        try { broadcastChannelRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Force clean reload
  const handlePerformRefresh = async () => {
    try {
      setSwNeedRefresh(false);
      setUpdateAvailable(false);

      // 1. Clear caches
      if ('caches' in window) {
        try {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        } catch (e) {}
      }

      // 2. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        } catch (e) {}
      }

      // 3. Clear update flags
      try {
        localStorage.removeItem('aura_update_timestamp');
      } catch (e) {}

      // 4. Force hard reload from server
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = currentPath + (currentPath.includes('?') ? '&' : '?') + '_v=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <>
      <AnimatePresence>
        {updateAvailable && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-md w-[calc(100vw-3rem)]"
          >
            <div className={clsx(
              "relative p-5 rounded-3xl shadow-2xl border backdrop-blur-2xl overflow-hidden",
              isLight 
                ? "bg-white/90 border-rose-200 text-neutral-900 shadow-rose-500/10" 
                : "bg-neutral-900/90 border-rose-500/30 text-white shadow-black/80"
            )}>
              {/* Gradient Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30">
                    <Sparkles className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold tracking-tight">New Update Available!</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/20">
                        NEW
                      </span>
                    </div>
                    <p className={clsx("text-xs mt-0.5 leading-relaxed font-medium", isLight ? "text-neutral-600" : "text-neutral-300")}>
                      A fresh version of AURA Downloader is ready on the server. Please refresh to get the latest features!
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDismissed(true)}
                  className={clsx(
                    "p-1.5 rounded-full transition-colors flex-shrink-0",
                    isLight ? "hover:bg-neutral-200/60 text-neutral-500" : "hover:bg-white/10 text-neutral-400"
                  )}
                  title="Dismiss popup (Floating button will remain)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handlePerformRefresh}
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/25 active:scale-98 cursor-pointer"
                >
                  <RefreshCw className="w-4.5 h-4.5 animate-spin-slow" />
                  Refresh Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Badge when dismissed */}
      <AnimatePresence>
        {updateAvailable && isDismissed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={handlePerformRefresh}
            className={clsx(
              "fixed bottom-6 right-6 z-[9999] px-4 py-2.5 rounded-full shadow-2xl border flex items-center gap-2 font-bold text-xs backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer",
              isLight 
                ? "bg-white/95 border-rose-300 text-rose-600 shadow-rose-500/20 hover:bg-rose-50" 
                : "bg-neutral-900/95 border-rose-500/50 text-rose-400 shadow-black/80 hover:bg-neutral-800"
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Update Ready (Refresh)</span>
            <RefreshCw className="w-3.5 h-3.5 ml-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

