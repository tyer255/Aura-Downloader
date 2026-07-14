import re

with open("vite.config.ts", "r") as f:
    content = f.read()

target = r"globPatterns: \['\*\*/\*\.\{js,css,html,ico,png,svg\}'\]"
replacement = r"globPatterns: ['**/*.{js,css,html,ico,png,svg}'],\n      importScripts: ['/push-sw.js']"

content = re.sub(target, replacement, content)

with open("vite.config.ts", "w") as f:
    f.write(content)
