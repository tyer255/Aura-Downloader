import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, path) => {
        if (path.endsWith('.js') && (path.includes('sw.js') || path.includes('workbox-'))) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      let htmlPath = path.join(distPath, 'index.html');
      if (!fs.existsSync(htmlPath)) {
          return res.status(404).send('Not Found');
      }
      
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Dynamic SSR Meta Tags
      const routes = {
        '/pinterest-downloader': {
            title: 'Aura Downloader - Download Pinterest Videos & Images Free',
            desc: 'Best free Pinterest Downloader online. Download Pinterest videos, images, and GIFs in HD quality without watermark using Aura Downloader.',
            keywords: 'Aura Downloader, Pinterest downloader, download Pinterest video'
        },
        '/youtube-downloader': {
            title: 'Aura Downloader - YouTube Downloader, Shorts & Reels Saver',
            desc: 'Aura Downloader is the best free YouTube Downloader. Download YouTube videos, Shorts, and Reels in 1080p, 4K HD effortlessly.',
            keywords: 'Aura Downloader, YouTube downloader, YouTube Shorts downloader'
        },
        '/instagram-downloader': {
            title: 'Aura Downloader - Instagram Reels & Video Downloader',
            desc: 'Free online Instagram Downloader by Aura Downloader. Download Instagram reels, photos, videos, IGTV, and stories in high quality easily.',
            keywords: 'Aura Downloader, Instagram downloader, Instagram reels downloader'
        },
        '/snapchat-downloader': {
            title: 'Aura Downloader - Download Snapchat Videos Free',
            desc: 'Free online Snapchat Video Downloader. Download Snapchat Spotlight videos and stories in high quality directly to your device with Aura Downloader.',
            keywords: 'Aura Downloader, Snapchat downloader, download Snapchat video'
        },
        '/tiktok-downloader': {
            title: 'Aura Downloader - TikTok Downloader Without Watermark',
            desc: 'Best free TikTok Downloader. Download TikTok videos without watermark in HD quality using Aura Downloader.',
            keywords: 'Aura Downloader, TikTok downloader, download TikTok video'
        },
        '/facebook-downloader': {
            title: 'Aura Downloader - Download Facebook Videos & Reels Free',
            desc: 'Free online Facebook Video Downloader by Aura Downloader. Download Facebook reels and videos in HD quality to your device fast and easily.',
            keywords: 'Aura Downloader, Facebook downloader, FB video downloader'
        },
        '/reddit-downloader': {
            title: 'Aura Downloader - Download Reddit Videos With Audio',
            desc: 'Free Reddit Video Downloader. Download Reddit videos with sound in HD quality with Aura Downloader.',
            keywords: 'Aura Downloader, Reddit downloader, download Reddit video with audio'
        },
        '/x-downloader': {
            title: 'Aura Downloader - Download Twitter Videos & GIFs Free',
            desc: 'Best free X (Twitter) Downloader. Download videos, GIFs, and media from tweets in HD quality quickly and securely with Aura Downloader.',
            keywords: 'Aura Downloader, Twitter downloader, X downloader'
        },
        '/linkedin-downloader': {
            title: 'Aura Downloader - Download LinkedIn Videos Free',
            desc: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.',
            keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video'
        },
        '/spotify-downloader': {
            title: 'Aura Downloader - Download Spotify Audio Free',
            desc: 'Free online Spotify Audio Downloader. Download Spotify tracks and playlists in MP3 format with Aura Downloader.',
            keywords: 'Aura Downloader, Spotify downloader, download Spotify audio'
        },
        '/threads-downloader': {
            title: 'Aura Downloader - Download Threads Photos & Videos Free',
            desc: 'Free online Threads Downloader. Download Threads photos, videos, and multi-media carousels in high quality directly to your device with Aura Downloader.',
            keywords: 'Aura Downloader, Threads downloader, download Threads photo'
        }
      };

      const routeData = routes[req.path];
      if (routeData) {
         html = html.replace(/<title>.*?<\/title>/, \`<title>\${routeData.title}</title>\`);
         html = html.replace(/<meta name="description" content=".*?" \/>/, \`<meta name="description" content="\${routeData.desc}" />\`);
         html = html.replace(/<meta name="keywords" content=".*?" \/>/, \`<meta name="keywords" content="\${routeData.keywords}" />\`);
         html = html.replace(/<meta property="og:title" content=".*?" \/>/, \`<meta property="og:title" content="\${routeData.title}" />\`);
         html = html.replace(/<meta property="og:description" content=".*?" \/>/, \`<meta property="og:description" content="\${routeData.desc}" />\`);
         html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, \`<meta name="twitter:title" content="\${routeData.title}" />\`);
         html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, \`<meta name="twitter:description" content="\${routeData.desc}" />\`);
      }
      
      // Also inject og:image if not present, though it's likely handled by index.html or client, 
      // let's ensure it's there.
      const ogImage = 'https://aura-download.ai.studio/banner.jpg';
      if (!html.includes('property="og:image"')) {
         html = html.replace('</head>', \`<meta property="og:image" content="\${ogImage}" />\\n</head>\`);
      }
      if (!html.includes('name="twitter:image"')) {
         html = html.replace('</head>', \`<meta name="twitter:image" content="\${ogImage}" />\\n</head>\`);
      }

      res.send(html);
    });
`;

const targetBlock = `    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.js') && (path.includes('sw.js') || path.includes('workbox-'))) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });`;

code = code.replace(targetBlock, replacement);
fs.writeFileSync('server.ts', code);
console.log('Fixed SSR meta tags');
