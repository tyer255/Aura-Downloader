import re

with open("index.html", "r") as f:
    content = f.read()

content = content.replace('<meta property="og:image" content="/banner.jpg" />', '<meta property="og:image" itemprop="image" content="https://aura-downloader-yg40.onrender.com/banner.jpg" />\n    <meta property="og:image:secure_url" itemprop="image" content="https://aura-downloader-yg40.onrender.com/banner.jpg" />\n    <meta property="og:image:type" content="image/jpeg" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />')
content = content.replace('<meta property="twitter:image" content="/banner.jpg" />', '<meta property="twitter:image" content="https://aura-downloader-yg40.onrender.com/banner.jpg" />')
content = content.replace('<meta property="og:url" content="https://universal-downloader.onrender.com/" />', '<meta property="og:url" content="https://aura-downloader-yg40.onrender.com/" />')

with open("index.html", "w") as f:
    f.write(content)

print("Updated OG tags")
