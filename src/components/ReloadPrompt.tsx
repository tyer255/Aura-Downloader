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
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

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
                onClick={() => updateServiceWorker(true)}
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
