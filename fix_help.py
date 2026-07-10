import re
with open("src/App.tsx", "r") as f:
    content = f.read()

target = """          </button>
          <button 
             onClick={() => {"""

replacement = """          </button>
          
          {/* Help Button */}
          <button
            onClick={() => startTour()}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer hidden sm:flex",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            )}
            title="How to use"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button 
             onClick={() => {"""

content = content.replace(target, replacement)
with open("src/App.tsx", "w") as f:
    f.write(content)
