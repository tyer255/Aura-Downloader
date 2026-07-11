import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; }[] = ["""
replacement = """const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; keywords?: string }[] = ["""
content = content.replace(target, replacement)

content = content.replace(
    "title: 'Pinterest Downloader - Video & Image Saver', description: 'Download high-quality Pinterest images, videos, and GIFs for free. Our fast Pinterest downloader works on all devices without watermarks.'",
    "title: 'Pinterest Downloader - Download Pinterest Videos & Images Free', description: 'Best free Pinterest Downloader online. Download Pinterest videos, images, and GIFs in HD quality without watermark. Fast, secure, and easy to use.', keywords: 'Pinterest downloader, download Pinterest video, Pinterest video downloader, Pinterest saver'"
)

content = content.replace(
    "title: 'YouTube Downloader - Video & Audio Saver', description: 'Download YouTube videos and audio in HD quality. The fastest free YouTube video downloader for MP4 and MP3 formats.'",
    "title: 'YouTube Downloader - Download YouTube Videos & MP3 Free', description: 'The best free YouTube Downloader. Download YouTube videos in 1080p, 4K HD, and convert YouTube to MP3 audio effortlessly.', keywords: 'YouTube downloader, download YouTube video, YouTube to mp3, free YouTube video downloader'"
)

content = content.replace(
    "title: 'Instagram Downloader - Save Photos & Videos', description: 'Download Instagram videos, photos, stories, IGTV and carousels for free. Fast and secure Instagram media saver.'",
    "title: 'Instagram Downloader - Download Instagram Videos, Photos & Reels', description: 'Free online Instagram Downloader. Download Instagram reels, photos, videos, IGTV, and stories in high quality easily.', keywords: 'Instagram downloader, download Instagram video, Instagram reels downloader, Instagram story saver'"
)

content = content.replace(
    "title: 'TikTok Downloader - No Watermark Video Saver', description: 'Download TikTok videos without watermark. Fast, free HD TikTok video and MP3 audio downloader.'",
    "title: 'TikTok Downloader - Download TikTok Videos Without Watermark', description: 'Best free TikTok Downloader. Download TikTok videos without watermark in HD quality. Fast MP4 & MP3 TikTok saver online.', keywords: 'TikTok downloader, download TikTok video, TikTok no watermark, TikTok video downloader'"
)

content = content.replace(
    "title: 'Facebook Video Downloader - Save FB Videos', description: 'Download Facebook videos and reels in high quality. Free and fast FB video saver.'",
    "title: 'Facebook Downloader - Download Facebook Videos & Reels Free', description: 'Free online Facebook Video Downloader. Download Facebook reels and videos in HD quality (MP4) to your device fast and easily.', keywords: 'Facebook downloader, download Facebook video, Facebook reels downloader, FB video downloader'"
)

content = content.replace(
    "title: 'Reddit Video Downloader - Save Videos with Audio', description: 'Download Reddit videos with sound and audio. Save Reddit images, GIFs, and media fast and free.'",
    "title: 'Reddit Downloader - Download Reddit Videos With Audio', description: 'Free Reddit Video Downloader. Download Reddit videos with sound (audio) in HD quality. Save Reddit GIFs and images easily.', keywords: 'Reddit downloader, download Reddit video with audio, Reddit video saver'"
)

content = content.replace(
    "title: 'X (Twitter) Video Downloader - Save Tweets', description: 'Download videos and GIFs from X (Twitter). Fast, free, and secure X media saver.'",
    "title: 'X Downloader - Download Twitter Videos & GIFs Free', description: 'Best free X (Twitter) Downloader. Download videos, GIFs, and media from tweets in HD quality quickly and securely.', keywords: 'Twitter downloader, X downloader, download Twitter video, save tweet video'"
)

content = content.replace(
    "title: 'LinkedIn Video Downloader - Save LI Videos', description: 'Download LinkedIn videos, images, and documents. Save professional media from LinkedIn posts easily.'",
    "title: 'LinkedIn Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device.', keywords: 'LinkedIn downloader, download LinkedIn video, LinkedIn video saver'"
)

helmet_target = """      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />"""

helmet_replacement = """      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        {activeTabData.keywords && <meta name="keywords" content={activeTabData.keywords} />}
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />"""

content = content.replace(helmet_target, helmet_replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
