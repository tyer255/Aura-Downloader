import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace padding
content = re.sub(r'pt-8 pb-12 px-4', 'pt-24 sm:pt-28 pb-12 px-4', content)

header_regex = r'\{\/\* App Branding Header \*\/\}.*?\{\/\* Top Header Controls \*\/\}'

replacement_header = """{/* App Branding Header - Glassmorphism Full Width Strip */}
      <div className={clsx(
        "fixed top-0 left-0 right-0 w-full flex items-center justify-center sm:justify-start gap-3 sm:gap-4 px-4 py-3 sm:px-8 sm:py-4 border-b backdrop-blur-xl z-50 transition-colors duration-700",
        isLight ? "bg-white/70 border-neutral-200/50 shadow-sm" : "bg-[#0c0a09]/70 border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
      )}>
        <div className={clsx("absolute inset-0 pointer-events-none", isLight ? "bg-gradient-to-r from-red-500/5 via-rose-500/5 to-orange-500/5" : "bg-gradient-to-r from-red-500/10 via-rose-500/10 to-orange-500/10")} />
        
        {/* Custom Aura Logo */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-orange-500 p-[2px] shadow-lg shadow-red-500/30 relative shrink-0">
           <div className={clsx("w-full h-full rounded-[10px] flex items-center justify-center backdrop-blur-md relative overflow-hidden", isLight ? "bg-white/20" : "bg-black/20")}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white filter drop-shadow-md z-10" strokeWidth={2.5} />
           </div>
        </div>

        <div className="relative z-10">
           <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-600 to-orange-500 drop-shadow-sm uppercase">AURA Downloader</h1>
        </div>
      </div>

      {/* Top Header Controls */}"""

content = re.sub(header_regex, replacement_header, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Header strip updated")
