import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'isLight \n                    ? "bg-white border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-400" \n                    : "bg-[#1c0d0f]/80 border-white/[0.08] hover:border-white/15 focus-within:border-white/20"',
    'isLight \n                    ? "bg-white/70 backdrop-blur-xl border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-400" \n                    : "bg-[#1c0d0f]/60 backdrop-blur-xl border-white/[0.08] hover:border-white/15 focus-within:border-white/20"'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
