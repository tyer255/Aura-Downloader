import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import clsx from 'clsx';
import { m as motion, LazyMotion, domMax } from 'motion/react';
import { Youtube, Sun, Moon, ChevronLeft } from 'lucide-react';

const TABS = [
  { id: 'pinterest', name: 'Pinterest Downloader' },
  { id: 'youtube', name: 'YouTube Downloader' },
  { id: 'instagram', name: 'Instagram Downloader' },
  { id: 'tiktok', name: 'TikTok Downloader' },
  { id: 'facebook', name: 'Facebook Downloader' },
  { id: 'reddit', name: 'Reddit Downloader' },
  { id: 'x', name: 'X / Twitter Downloader' },
  { id: 'linkedin', name: 'LinkedIn Downloader' },
];

export function StaticPageView({ title, children, isLight, setIsLight }: { title: string; children: React.ReactNode; isLight: boolean; setIsLight: (val: boolean) => void }) {
  const getBgGlow = () => {
    if (isLight) {
      return 'from-neutral-100/80 via-neutral-50/40 to-neutral-50';
    }
    return 'from-neutral-900 via-neutral-900 to-black';
  };

  return (
    <>
      <Helmet>
        <title>{title} | Social Downloader</title>
      </Helmet>
      <LazyMotion features={domMax}>
        <div className={clsx(
          "min-h-screen bg-gradient-to-b flex flex-col items-center pt-8 pb-12 px-4 font-sans transition-colors duration-700",
          isLight ? "text-neutral-900 selection:bg-red-500/10" : "text-neutral-50 selection:bg-red-500/30",
          getBgGlow()
        )}>
          {/* Top Header */}
          <div className="w-full max-w-3xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">
            <Link to="/" className={clsx(
              "flex items-center rounded-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-1 sm:py-1.5 transition-colors border shrink-0 group",
              isLight ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900" : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
            )}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs sm:text-sm font-medium tracking-wide uppercase whitespace-nowrap">Back Home</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full max-w-3xl flex-1 relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center tracking-tight">{title}</h1>
              <div className={clsx(
                "w-full rounded-3xl p-6 sm:p-10 border shadow-2xl backdrop-blur-xl relative overflow-hidden",
                isLight 
                  ? "bg-white/80 border-white/60 shadow-black/5" 
                  : "bg-[#1e1516]/80 border-white/10 shadow-black/40"
              )}>
                <div className={clsx(
                  "prose prose-sm sm:prose-base max-w-none",
                  isLight ? "prose-neutral" : "prose-invert"
                )}>
                  {children}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="mt-auto pt-24 pb-8 w-full max-w-7xl mx-auto px-4 relative z-10">
            <div className={clsx("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12 py-8 border-y", isLight ? "border-neutral-200/60" : "border-white/10")}>
              {TABS.map((tab) => (
                <Link 
                  key={tab.id} 
                  to={`/${tab.id}-downloader`}
                  className={clsx(
                    "flex flex-col gap-1 text-sm font-medium transition-colors hover:-translate-y-0.5 transform duration-200",
                    isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
            <div className="text-center flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
                <Link to="/about" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>About</Link>
                <Link to="/contact" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Contact</Link>
                <Link to="/faq" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>FAQ</Link>
                <Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>
                <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Cookie Policy</Link>
                <Link to="/terms" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Terms & Conditions</Link>
                <Link to="/dmca" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>DMCA</Link>
              </div>
              <p className={clsx(
                "text-sm font-medium transition-colors",
                isLight ? "text-neutral-500" : "text-neutral-500"
              )}>
                all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
              </p>
            </div>
          </footer>
        </div>
      </LazyMotion>
    </>
  );
}
