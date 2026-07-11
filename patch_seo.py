import re

with open("index.html", "r") as f:
    content = f.read()

# Replace title
content = re.sub(
    r'<title>.*?</title>',
    '<title>YouTube, Pinterest, TikTok Downloader (No Watermark) | Universal Downloader</title>',
    content
)

# Replace description
content = re.sub(
    r'<meta name="description" content=".*?" />',
    '<meta name="description" content="Best free YouTube downloader, Pinterest downloader, and TikTok downloader without watermark. Save videos, photos, and audio from Instagram, Facebook, Reddit in high quality." />',
    content
)

# Replace keywords
content = re.sub(
    r'<meta name="keywords" content=".*?" />',
    '<meta name="keywords" content="youtube downloader, pinterest downloader, tiktok downloader without watermark, social media downloader, video downloader, download youtube shorts, instagram reel downloader, facebook downloader" />',
    content
)

# Replace images
content = content.replace('<meta property="og:image" content="/icon-512.png" />', '<meta property="og:image" content="/banner.jpg" />')
content = content.replace('<meta property="twitter:image" content="/icon-512.png" />', '<meta property="twitter:image" content="/banner.jpg" />')

# Replace OG title and description
content = re.sub(
    r'<meta property="og:title" content=".*?" />',
    '<meta property="og:title" content="YouTube, Pinterest, TikTok Downloader (No Watermark) | Universal Downloader" />',
    content
)
content = re.sub(
    r'<meta property="og:description" content=".*?" />',
    '<meta property="og:description" content="Best free YouTube downloader, Pinterest downloader, and TikTok downloader without watermark. Save videos, photos, and audio from Instagram, Facebook, Reddit in high quality." />',
    content
)
content = re.sub(
    r'<meta property="twitter:title" content=".*?" />',
    '<meta property="twitter:title" content="YouTube, Pinterest, TikTok Downloader (No Watermark) | Universal Downloader" />',
    content
)
content = re.sub(
    r'<meta property="twitter:description" content=".*?" />',
    '<meta property="twitter:description" content="Best free YouTube downloader, Pinterest downloader, and TikTok downloader without watermark. Save videos, photos, and audio from Instagram, Facebook, Reddit in high quality." />',
    content
)

# Add OG URL script and placeholder if not exists
if '<meta property="og:url"' not in content:
    # insert before og:type
    content = content.replace('<meta property="og:type"', '<meta property="og:url" content="https://universal-downloader.onrender.com/" />\n    <meta property="og:type"')

with open("index.html", "w") as f:
    f.write(content)
print("index.html SEO updated")
