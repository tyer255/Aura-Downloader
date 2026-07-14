import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import clsx from 'clsx';
import { subscribeUserToPush } from '../push';

export default function NotificationRequest({ isLight }: { isLight: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and permission is default
    if ('Notification' in window && Notification.permission === 'default') {
      const dismissed = localStorage.getItem('push-dismissed');
      if (!dismissed) {
        // Show after a short delay so it's not too aggressive
        const t = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const handleEnable = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await subscribeUserToPush();
        setShow(false);
      } else {
        localStorage.setItem('push-dismissed', 'true');
        setShow(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full px-4"
        >
          <div className={clsx(
            "p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between gap-4",
            isLight 
              ? "bg-white/70 border-white/50 text-neutral-900 shadow-black/5" 
              : "bg-neutral-900/70 border-white/10 text-white shadow-black/50"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 rounded-full text-white">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Enable Notifications</h3>
                <p className={clsx("text-xs", isLight ? "text-neutral-600" : "text-neutral-400")}>
                  Get notified when new features are added!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEnable}
                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Allow
              </button>
              <button 
                onClick={handleDismiss}
                className={clsx(
                  "p-1.5 rounded-full transition-colors",
                  isLight ? "hover:bg-neutral-200/50" : "hover:bg-white/10"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
