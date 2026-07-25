import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';

export default function ReloadPrompt({ isLight }: { isLight: boolean }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      if (r) {
        // Immediate check just in case
        try {
          r.update();
        } catch (e) {}

        // Check for updates periodically
        setInterval(() => {
          console.log('Checking for SW update...');
          try {
            r.update();
          } catch (e) {}
        }, 60 * 1000); // Check every minute
        
        // Check for updates when the window regains focus
        window.addEventListener('focus', () => {
          console.log('Window focused, checking for SW update...');
          try {
            r.update();
          } catch (e) {}
        });
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });


  React.useEffect(() => {
    if (needRefresh && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('App Updated!', {
          body: 'A new version of AURA Downloader is available. Refresh to use the latest features!',
          icon: '/icon-192.png'
        });
      } catch (e) {
        // Some browsers require Service Worker registration to show notifications
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('App Updated!', {
            body: 'A new version of AURA Downloader is available. Refresh to use the latest features!',
            icon: '/icon-192.png'
          });
        });
      }
    }
  }, [needRefresh]);

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
        >
          <div className={clsx(
            "p-5 rounded-2xl shadow-2xl border backdrop-blur-xl",
            isLight 
              ? "bg-white/70 border-white/50 text-neutral-900 shadow-black/5" 
              : "bg-neutral-900/70 border-white/10 text-white shadow-black/50"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Update Available</h3>
                <p className={clsx("text-sm", isLight ? "text-neutral-600" : "text-neutral-400")}>
                  Your website is updated, please refresh.
                </p>
              </div>
              <button 
                onClick={() => setNeedRefresh(false)}
                className={clsx(
                  "p-1.5 rounded-full transition-colors",
                  isLight ? "hover:bg-neutral-200/50" : "hover:bg-white/10"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={async () => {
                  setNeedRefresh(false);
                  
                  // Clear all caches to ensure we fetch the latest assets
                  if ('caches' in window) {
                    try {
                      const cacheNames = await caches.keys();
                      await Promise.all(cacheNames.map(name => caches.delete(name)));
                    } catch (err) {
                      console.error('Failed to clear caches', err);
                    }
                  }

                  // Unregister service workers for a clean slate
                  if ('serviceWorker' in navigator) {
                    try {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(r => r.unregister()));
                    } catch (err) {
                      console.error('Failed to unregister SW', err);
                    }
                  }

                  // Force reload from network
                  window.location.reload();
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
