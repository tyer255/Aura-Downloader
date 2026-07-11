import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Make the settings drawer significantly more glassmorphic
content = content.replace(
    """              className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-2xl backdrop-blur-2xl",
                isLight ? "bg-white/70 text-neutral-900 border-l border-white/50" : "bg-[#0c0a09]/70 text-white border-l border-white/10"
              )}""",
    """              className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-150",
                isLight ? "bg-white/40 text-neutral-900 border-l border-white/50" : "bg-[#0c0a09]/50 text-white border-l border-white/10"
              )}"""
)

# And make sure header is slightly more transparent
content = content.replace(
    """<div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200/50 dark:border-white/10">""",
    """<div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200/30 dark:border-white/10">"""
)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Glassmorphism patched")
