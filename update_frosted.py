import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'isLight ? "bg-white border-neutral-200/80" : "bg-[#1e1516] border-white/5"',
    'isLight ? "bg-white/70 backdrop-blur-xl border-neutral-200/80" : "bg-[#1e1516]/70 backdrop-blur-xl border-white/5"'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
