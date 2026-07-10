import re
with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                    className={clsx(
                      "absolute right-2 top-2 bottom-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:opacity-50" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:opacity-50"
                    )}
                  >
                    {isLoading ? (
                      <div className={clsx(
                        "w-5 h-5 border-[2.5px] rounded-full animate-spin",
                        isLight ? "border-neutral-400/40 border-t-neutral-100" : "border-neutral-400/40 border-t-neutral-800"
                      )} />
                    ) : (
                      <Search className={clsx("w-5 h-5 sm:w-6 sm:h-6", isLight ? "text-white" : "text-neutral-800")} />
                    )}"""

replacement = """                    className={clsx(
                      "absolute right-2 top-2 bottom-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-70" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-400 disabled:opacity-70"
                    )}
                  >
                    {isLoading ? (
                      <div className={clsx(
                        "w-5 h-5 border-[2.5px] rounded-full animate-spin",
                        isLight ? "border-neutral-400/40 border-t-neutral-100" : "border-neutral-400/40 border-t-neutral-800"
                      )} />
                    ) : (
                      <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}"""

content = content.replace(target, replacement)
with open("src/App.tsx", "w") as f:
    f.write(content)
