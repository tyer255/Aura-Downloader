import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """      {/* Top Header */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className={clsx(
          "flex items-center rounded-full pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 transition-colors border shrink-0",
          isLight ? "bg-white border-neutral-200 text-neutral-600" : "bg-white/5 border border-white/10 text-white"
        )}>
          <span className="text-xs sm:text-sm font-medium tracking-wide mr-2 sm:mr-3 uppercase whitespace-nowrap">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 whitespace-nowrap">
             <Youtube className="w-3 h-3 sm:w-4 sm:h-4" /> Subscribe
          </a>
        </div>"""

replacement = """      {/* App Branding Header */}
      <div className={clsx(
        "w-full max-w-2xl flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5 mb-6 rounded-[2rem] border shadow-2xl backdrop-blur-xl relative z-20 overflow-hidden",
        isLight ? "bg-white/60 border-white text-neutral-900 shadow-neutral-200/50" : "bg-[#1a1515]/60 border-white/10 text-white shadow-black/50"
      )}>
        <div className={clsx("absolute inset-0 pointer-events-none", isLight ? "bg-gradient-to-r from-red-500/5 via-rose-500/5 to-orange-500/5" : "bg-gradient-to-r from-red-500/10 via-rose-500/10 to-orange-500/10")} />
        
        {/* Custom Aura Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-500 via-rose-600 to-orange-500 p-[2px] shadow-lg shadow-red-500/30 relative shrink-0">
           <div className={clsx("w-full h-full rounded-[14px] sm:rounded-[22px] flex items-center justify-center backdrop-blur-md relative overflow-hidden", isLight ? "bg-white/20" : "bg-black/20")}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <Download className="w-7 h-7 sm:w-8 sm:h-8 text-white filter drop-shadow-md z-10" strokeWidth={2.5} />
           </div>
        </div>

        <div>
           <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-600 to-orange-500 drop-shadow-sm">Aura Downloader</h1>
           <p className={clsx("text-xs sm:text-sm font-bold tracking-wide uppercase mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Universal Media Saver</p>
        </div>
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-12 relative z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className={clsx(
          "flex items-center rounded-full pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 transition-colors border shrink-0 shadow-sm",
          isLight ? "bg-white border-neutral-200 text-neutral-700" : "bg-white/5 border border-white/10 text-neutral-200"
        )}>
          <span className="text-sm sm:text-base font-bold tracking-wide mr-3 sm:mr-4 uppercase whitespace-nowrap">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-sm sm:text-base px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 whitespace-nowrap">
             <Youtube className="w-4 h-4 sm:w-5 sm:h-5" /> Subscribe
          </a>
        </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Header updated successfully!")
else:
    print("Target not found in App.tsx")

