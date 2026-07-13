import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = r'\{\/\* App Branding Header - Glassmorphism Full Width Strip \*\/\}.*?\{\/\* Top Header Controls \*\/\}'

replacement = """{/* App Branding Header - Glassmorphism Full Width Strip */}
      <div className={clsx(
        "fixed top-0 left-0 right-0 w-full flex items-center justify-start gap-3 sm:gap-3.5 px-4 py-3 sm:px-6 sm:py-3 border-b backdrop-blur-xl z-50 transition-colors duration-700 shadow-sm",
        isLight ? "bg-white/80 border-neutral-200/50" : "bg-[#0c0a09]/80 border-white/5"
      )}>
        {/* Custom Premium Aura Logo - App Store Style */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 p-[1px]">
          <div className="w-full h-full rounded-[15px] bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 flex items-center justify-center relative overflow-hidden shadow-inner">
             {/* Glossy overlay effect */}
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
             <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
             
             {/* Premium abstract download arrow icon */}
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md relative z-10">
                <path d="M12 4V16M12 16L7.5 11.5M12 16L16.5 11.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 20H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
        </div>

        <div className="relative z-10 ml-1">
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

print("Updated header to left align with premium iOS style logo")

