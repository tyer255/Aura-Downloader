import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = r'\{\/\* App Branding Header - Glassmorphism Full Width Strip \*\/\}.*?\{\/\* Top Header Controls \*\/\}'

replacement = """{/* App Branding Header - Glassmorphism Full Width Strip */}
      <div className={clsx(
        "fixed top-0 left-0 right-0 w-full flex items-center justify-end gap-3 sm:gap-4 px-4 py-3 sm:px-8 sm:py-3 border-b backdrop-blur-xl z-50 transition-colors duration-700 shadow-sm",
        isLight ? "bg-white/80 border-neutral-200/50" : "bg-[#0c0a09]/80 border-white/5"
      )}>
        {/* Custom Premium Aura Logo */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-[0.9rem] sm:rounded-[1rem] shadow-[0_4px_16px_-4px_rgba(244,63,94,0.4)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-red-500 to-orange-500" />
          <div className={clsx(
            "absolute inset-[1.5px] rounded-[0.8rem] sm:rounded-[0.9rem] flex items-center justify-center overflow-hidden transition-colors",
            isLight ? "bg-white" : "bg-[#0a0a0a]"
          )}>
             <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-500/10 blur-md pointer-events-none" />
             
             <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 drop-shadow-sm" fill="none">
               <path d="M12 2L4 18H8.5L12 11L15.5 18H20L12 2Z" fill="url(#aura-grad-logo)" />
               <path d="M12 9V22M12 22L8.5 18.5M12 22L15.5 18.5" stroke={isLight ? "#171717" : "#FFFFFF"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               <defs>
                 <linearGradient id="aura-grad-logo" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                   <stop stopColor="#f43f5e" />
                   <stop offset="1" stopColor="#f97316" />
                 </linearGradient>
               </defs>
             </svg>
          </div>
        </div>

        <div className="relative z-10 mr-2 sm:mr-4">
           <h1 className={clsx(
               "text-base sm:text-lg font-black tracking-tight uppercase",
               isLight ? "text-neutral-900" : "text-white"
           )}>AURA Downloader</h1>
        </div>
      </div>

      {/* Top Header Controls */}"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Updated header")

