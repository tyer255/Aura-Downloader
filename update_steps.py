import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10 shadow-lg shadow-black/30',
    'bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-xl border-white/5 hover:border-white/10 shadow-lg shadow-black/30'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
