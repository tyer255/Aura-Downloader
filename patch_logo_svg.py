import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = r'\{\/\* Custom Premium Aura Logo - App Store Style \*\/\}.*?\{\/\* Premium abstract download arrow icon \*\/\}.*?<\/svg>\s*<\/div>\s*<\/div>'

svg_replacement = """{/* Custom Premium Aura Logo - App Store Style */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl shadow-lg overflow-hidden p-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30" />
          <div className="w-full h-full rounded-[15px] flex items-center justify-center relative overflow-hidden shadow-inner bg-[#0a0f18]">
             {/* Glossy overlay effect and waves */}
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-70">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,50 L0,20 Q25,40 50,20 T100,30 L100,50 Z" fill="url(#wave-grad)"/>
                  <defs>
                    <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0066ff"/>
                      <stop offset="100%" stopColor="#9900ff"/>
                    </linearGradient>
                  </defs>
                </svg>
             </div>
             
             {/* Premium abstract 'A' download icon */}
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="relative z-10 drop-shadow-md">
                <defs>
                   <linearGradient id="a-grad" x1="0.5" y1="0" x2="0.5" y2="1">
                     <stop offset="0%" stopColor="#00e5ff"/>
                     <stop offset="100%" stopColor="#0044ff"/>
                   </linearGradient>
                </defs>
                {/* The "A" shape */}
                <path d="M28 65 L46 22 Q50 14 54 22 L72 65" stroke="url(#a-grad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* The Arrow */}
                <path d="M50 38 L50 58 M42 50 L50 58 L58 50" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* The Tray */}
                <path d="M36 68 L36 72 Q36 78 42 78 L58 78 Q64 78 64 72 L64 68" stroke="#00ccff" strokeWidth="6" strokeLinecap="round" fill="none"/>
             </svg>
          </div>
        </div>"""

if re.search(target, content, flags=re.DOTALL):
    content = re.sub(target, svg_replacement, content, flags=re.DOTALL)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Logo updated to match the image provided")
else:
    print("Could not find the logo block")

