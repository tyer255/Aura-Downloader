import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Readable } from "stream";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy endpoint for downloading files to bypass CORS
app.get("/api/proxy", async (req, res) => {
  const mediaUrl = req.query.url as string;
  if (!mediaUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(mediaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 504 || response.status === 502) {
          return res.redirect(mediaUrl);
      }
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    
    // Cache control for performance
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (!response.body) {
      throw new Error("No response body");
    }

    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.pipe(res);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return res.redirect(mediaUrl);
  }
});

app.get("/api/download", async (req, res) => {
  const mediaUrl = req.query.url as string;
  const reqFileName = req.query.filename as string;
  if (!mediaUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(mediaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
       if (response.status === 403 || response.status === 504 || response.status === 502) {
          // If forbidden or timed out, we might just redirect the user to download it themselves
          return res.redirect(mediaUrl);
       }
       throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const fileName = reqFileName || mediaUrl.split("/").pop() || "media-download";
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    if (!response.body) {
      throw new Error("No response body");
    }

    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.pipe(res);
  } catch (error: any) {
    console.error("Download error:", error.message);
    return res.redirect(mediaUrl);
  }
});

let globalBrowser: any = null;
async function getBrowser() {
    if (!globalBrowser) {
        const path = await import('path');
        const puppeteer = (await import('puppeteer')).default;
        globalBrowser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
        });
    }
    return globalBrowser;
}

app.post("/api/ig-media", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    let type = "video";
    let mediaUrls: string[] = [];
    let thumbnail = "";

    const isProfile = !url.includes('/p/') && !url.includes('/reel/') && !url.includes('/tv/') && !url.includes('/stories/');

    const browser = await getBrowser();
    
    let page: any;
    try {
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(40000);
        
        if (isProfile) {
            type = "image";
            await page.goto('https://indown.io/insta-dp-viewer', { waitUntil: 'networkidle2' });
            await page.type('input[name="link"]', url);
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
                page.click('button[type="submit"]')
            ]);
            
            let dpUrl = null;
            for (let i = 0; i < 5; i++) {
                try {
                    dpUrl = await page.evaluate(() => {
                        const a = Array.from(document.querySelectorAll('a')).find(a => (a.href && (a.href.includes('dl=1') || a.href.includes('.jpg'))));
                        return a ? a.href : null;
                    });
                    if (dpUrl) break;
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e: any) {
                    if (!e.message.includes("Execution context was destroyed")) throw e;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (dpUrl) {
                mediaUrls.push(dpUrl);
                thumbnail = dpUrl;
            }
        } else {
            await page.goto('https://sssinstagram.com/', { waitUntil: 'networkidle2' });
            await page.type('#input', url);
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
                page.click('.form__submit')
            ]);
            
            let results: any[] = [];
            for (let i = 0; i < 5; i++) {
                try {
                    results = await page.evaluate(() => {
                        const res: any[] = [];
                        const items = document.querySelectorAll('li');
                        if (items.length > 0) {
                            items.forEach(li => {
                                const img = li.querySelector('img')?.src;
                                const a = li.querySelector('a')?.href;
                                if(a && a.includes('media.sssinstagram.com')) res.push({img, url: a});
                            });
                        } else {
                           const links = Array.from(document.querySelectorAll('a')).filter(a => a.href && a.href.includes('media.sssinstagram.com')).map(a=>a.href);
                           const images = Array.from(document.querySelectorAll('img')).map(i=>i.src).filter(s=> s && (s.includes('instagram') || s.includes('fbcdn')));
                           if (links.length > 0) {
                               for(let j=0; j<links.length; j++) {
                                   res.push({url: links[j], img: images[j] || images[0] || ""});
                               }
                           }
                        }
                        return res;
                    });
                    if (results && results.length > 0) break;
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e: any) {
                    if (!e.message.includes("Execution context was destroyed")) throw e;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
            
            console.log("Puppeteer results for IG:", results);

            if (results.length > 1) {
                type = "carousel";
                mediaUrls = results.map(r => r.url);
                thumbnail = results[0].img;
            } else if (results.length === 1) {
                type = results[0].url.includes('.mp4') ? "video" : "image";
                mediaUrls = [results[0].url];
                thumbnail = results[0].img;
            }
        }
    } finally {
        if (page) await page.close();
    }

    if (mediaUrls.length === 0) {
        throw new Error("Could not find any suitable downloadable formats for this link.");
    }

    let igTitle = "Instagram Media";
    if (isProfile) {
        const match = url.match(/instagram\.com\/([^/?]+)/);
        const username = match ? match[1] : "Profile";
        igTitle = `Instagram DP - @${username}`;
    } else {
        const match = url.match(/instagram\.com\/(p|reel|tv)\/([^/?]+)/);
        const shortcode = match ? match[2] : "Media";
        igTitle = `Instagram ${type.charAt(0).toUpperCase() + type.slice(1)} - ${shortcode}`;
    }

    return res.json({
      success: true,
      type: type,
      download_url: mediaUrls[0],
      mediaUrls: mediaUrls,
      thumbnail_url: thumbnail,
      title: igTitle,
      dp_url: isProfile ? mediaUrls[0] : undefined
    });

  } catch (err: any) {
    console.error("Instagram Downloader Error:", err.message);
    return res.json({ success: false, error: "Error: " + err.message });
  }
});

app.post("/api/fetch-facebook", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(40000);
    
    // We can use snapsave.app or fdown.net for FB
    await page.goto('https://fdown.net/', { waitUntil: 'networkidle2' });
    await page.type('input[name="URLz"]', url);
    
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"]')
    ]);

    let videoUrl = await page.evaluate(() => {
        const hd = document.querySelector('#hdlink');
        const sd = document.querySelector('#sdlink');
        return (hd && hd.getAttribute('href')) || (sd && sd.getAttribute('href'));
    });
    
    await page.close();

    if (videoUrl) {
       return res.json({ success: true, type: "video", download_url: videoUrl, mediaUrls: [videoUrl], title: "Facebook Video" });
    } else {
       return res.status(404).json({ error: "Could not extract Facebook video. Make sure it's public." });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch Facebook video: " + err.message });
  }
});

app.post("/api/fetch-tiktok", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(40000);
    
    await page.goto('https://ssstik.io/en', { waitUntil: 'networkidle2' });
    await page.type('input[id="main_page_text"]', url);
    
    await page.click('button[id="submit"]');
    
    try {
       await page.waitForSelector('.result_overlay a', { timeout: 15000 });
    } catch(e) {}
    
    let downloadLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.result_overlay a.download_link'));
        return links.map(a => a.getAttribute('href')).filter(Boolean);
    });
    
    await page.close();

    if (downloadLinks && downloadLinks.length > 0) {
       return res.json({ success: true, type: "video", download_url: downloadLinks[0], mediaUrls: downloadLinks, title: "TikTok Video" });
    } else {
       return res.status(404).json({ error: "Could not extract TikTok video." });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch TikTok video: " + err.message });
  }
});

app.post("/api/fetch-twitter", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(40000);
    
    await page.goto('https://ssstwitter.com/', { waitUntil: 'networkidle2' });
    await page.type('input[id="main_page_text"]', url);
    
    await page.click('button[id="submit"]');
    
    try {
       await page.waitForSelector('.result_overlay a', { timeout: 15000 });
    } catch(e) {}
    
    let downloadLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.result_overlay a.download_link'));
        return links.map(a => a.getAttribute('href')).filter(Boolean);
    });
    
    await page.close();

    if (downloadLinks && downloadLinks.length > 0) {
       return res.json({ success: true, type: "video", download_url: downloadLinks[0], mediaUrls: downloadLinks, title: "Twitter Video" });
    } else {
       return res.status(404).json({ error: "Could not extract Twitter video." });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch Twitter video: " + err.message });
  }
});

app.post("/api/fetch-pinterest", async (req, res) => {
  const { url } = req.body;

  if (!url || (!url.includes("pinterest.com") && !url.includes("pin.it"))) {
    return res.status(400).json({ error: "Please enter a valid Pinterest link." });
  }

  try {
    let finalUrl = url;
    
    // Resolve short links manually if needed, though fetch mostly follows them.
    // We'll just let fetch follow the redirects.
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    };

    const fetchRes = await fetch(finalUrl, { headers });
    const html = await fetchRes.text();
    const resolvedUrl = fetchRes.url;
    const pinIdMatch = resolvedUrl.match(/\/pin\/(\d+)/);
    const targetPinId = pinIdMatch ? pinIdMatch[1] : null;

    let type = "image";
    let mediaUrls: string[] = [];
    let thumbnail = "";

    // 1. Try extracting from __PWS_DATA__ (Older Pinterest JSON structure)
    const pwsDataMatch = html.match(/<script[^>]*id="__PWS_DATA__"[^>]*>({.*?})<\/script>/);
    if (pwsDataMatch) {
      try {
        const jsonData = JSON.parse(pwsDataMatch[1]);
        const pins = jsonData.props?.initialReduxState?.pins || {};
        
        // Find the correct pin: use targetPinId if it exists, otherwise find the first pin that actually contains media
        const validPinId = Object.keys(pins).find(id => pins[id].story_pin_data || pins[id].videos || (pins[id].images && Object.keys(pins[id].images).length > 0));
        const pinId = targetPinId && pins[targetPinId] ? targetPinId : validPinId;
        
        if (pinId) {
          const pin = pins[pinId];
          if (pin.story_pin_data) {
            type = "carousel";
            const pages = pin.story_pin_data.pages || [];
            pages.forEach((page: any) => {
              if (page.blocks?.[0]?.video?.video_list) {
                const vList = page.blocks[0].video.video_list;
                mediaUrls.push(vList["V_720P"]?.url || vList["V_1080P"]?.url || (Object.values(vList)[0] as any)?.url);
              } else if (page.image?.images) {
                mediaUrls.push(page.image.images["originals"]?.url || page.image.images["736x"]?.url);
              }
            });
            thumbnail = pin.images?.["736x"]?.url || pin.images?.["originals"]?.url || "";
          } else if (pin.videos?.video_list) {
            type = "video";
            const vList = pin.videos.video_list;
            const vUrl = vList["V_720P"]?.url || vList["V_1080P"]?.url || (Object.values(vList)[0] as any)?.url;
            if (vUrl) mediaUrls.push(vUrl);
            thumbnail = pin.images?.["736x"]?.url || pin.images?.["originals"]?.url || "";
          } else if (pin.images) {
            type = "image";
            const iUrl = pin.images["originals"]?.url || pin.images["736x"]?.url;
            if (iUrl) mediaUrls.push(iUrl);
            thumbnail = iUrl || "";
          }
        }
      } catch (e) {
        console.error("Failed parsing __PWS_DATA__", e);
      }
    }

    // 2. Try extracting from Relay Response (Newer Pinterest JSON structure)
    if (mediaUrls.length === 0) {
      const relayMatches = [...html.matchAll(/<script[^>]*data-relay-response="true"[^>]*>({.*?})<\/script>/g)];
      for (const match of relayMatches) {
        try {
          const data = JSON.parse(match[1]);
          if (data.response?.data?.v3GetPinWithAcessToken?.pin) {
             const pin = data.response.data.v3GetPinWithAcessToken.pin;
             if (pin.storyPinData) {
                type = "carousel";
                pin.storyPinData.pages?.forEach((page: any) => {
                   if (page.blocks?.[0]?.video?.videoList) {
                      const vList = page.blocks[0].video.videoList;
                      mediaUrls.push(vList["V_720P"]?.url || vList["V_1080P"]?.url || (Object.values(vList)[0] as any)?.url);
                   } else if (page.image?.images) {
                      mediaUrls.push(page.image.images["originals"]?.url || page.image.images["736x"]?.url);
                   }
                });
                thumbnail = pin.images?.["736x"]?.url || pin.images?.["originals"]?.url || "";
             } else if (pin.videos?.videoList) {
                type = "video";
                const vList = pin.videos.videoList;
                const vUrl = vList["V_720P"]?.url || vList["V_1080P"]?.url || (Object.values(vList)[0] as any)?.url;
                if (vUrl) mediaUrls.push(vUrl);
                thumbnail = pin.images?.["736x"]?.url || pin.images?.["originals"]?.url || "";
             } else if (pin.images) {
                type = "image";
                const iUrl = pin.images["originals"]?.url || pin.images["736x"]?.url;
                if (iUrl) mediaUrls.push(iUrl);
                thumbnail = iUrl || "";
             }
             break;
          }
        } catch (e) {
          console.error("Failed parsing relay response", e);
        }
      }
    }

    // 3. Fallback to Regex
    if (mediaUrls.length === 0) {
      const videoRegex = /https:\/\/[^"']+\.mp4/g;
      const videos = html.match(videoRegex);
      if (videos && videos.length > 0) {
        const uniqueVideos = Array.from(new Set(videos)).filter(v => !v.includes('hls') && !v.includes('audio'));
        type = "video";
        const bestVideo = uniqueVideos.find((v) => v.includes("720p") || v.includes("1080p")) || uniqueVideos[0];
        if (bestVideo) mediaUrls = [bestVideo];
        
        const thumbRegex = /https:\/\/i\.pinimg\.com\/(?:originals|736x)\/[^"']+\.(?:jpg|png)/g;
        const thumbs = html.match(thumbRegex);
        thumbnail = thumbs ? thumbs[0] : "";
      } else {
        const imgRegex = /https:\/\/i\.pinimg\.com\/(?:originals|736x)\/[^"']+\.(?:jpg|png)/g;
        const images = html.match(imgRegex);
        if (images && images.length > 0) {
          const uniqueImages = Array.from(new Set(images));
          // Take only the first image to prevent mistaking related images as a carousel
          type = "image";
          mediaUrls = [uniqueImages[0]];
          thumbnail = uniqueImages[0];
        }
      }
    }

    if (mediaUrls.length === 0) {
      return res.status(404).json({ error: "Could not find media in this Pinterest link." });
    }

    // Filter out undefined/null
    mediaUrls = mediaUrls.filter(Boolean);

    let title = "Pinterest Media";
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
        title = titleMatch[1].replace(" - Pinterest", "").trim();
    }

    res.json({ success: true, type, thumbnail, mediaUrls, title });
  } catch (error: any) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to process the Pinterest link." });
  }
});




import youtubedl from "youtube-dl-exec";

app.post("/api/yt-media", async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  if (url.includes('/shorts/')) {
    const videoId = url.split('/shorts/')[1].split('?')[0];
    url = `https://www.youtube.com/watch?v=${videoId}`;
  }

  try {
    if (url.includes("/post/") || url.includes("/community")) {
      // Community post
      let html = "";
      try {
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(40000);
        await page.goto(url, { waitUntil: 'networkidle2' });
        html = await page.content();
        await page.close();
      } catch (err) {
        console.error("Puppeteer error on YT post:", err);
        const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        html = await fetchRes.text();
      }

      const match = html.match(/var ytInitialData = (\{.*?\});/);
      if (match) {
        const data = JSON.parse(match[1]);
        let imageUrl = "";
        
        const findImages = (obj: any, images: string[] = []) => {
            if (!obj) return;
            if (typeof obj !== 'object') return;
            
            const attachment = obj.backstagePostRenderer?.backstageAttachment || 
                               obj.sharedPostRenderer?.originalPost?.backstagePostRenderer?.backstageAttachment;
                               
            if (attachment?.backstageImageRenderer) {
                const img = attachment.backstageImageRenderer;
                if (img.image?.thumbnails) {
                    images.push(img.image.thumbnails[img.image.thumbnails.length - 1].url);
                }
            } else if (attachment?.postMultiImageRenderer) {
                const multi = attachment.postMultiImageRenderer.images;
                if (multi) {
                    multi.forEach((imgObj: any) => {
                        const img = imgObj.backstageImageRenderer;
                        if (img?.image?.thumbnails) {
                            images.push(img.image.thumbnails[img.image.thumbnails.length - 1].url);
                        }
                    });
                }
            }

            for (const key in obj) {
                findImages(obj[key], images);
            }
            return images;
        }

        const images = findImages(data) || [];

        if (images.length > 0) {
            if (images.length > 1) {
                return res.json({ success: true, type: "carousel", mediaUrls: images });
            } else {
                return res.json({ success: true, type: "image", mediaUrls: [images[0]], download_url: images[0] });
            }
        }
      }
      return res.status(404).json({ error: "No image found in community post" });
    } else {
      // Video or Short
      try {
        const { ytmp4, ytmp3 } = await import('@vreden/youtube_scraper');
        let title = "YouTube Video";
        let thumbnail = "";
        let formats: any[] = [];
        let vredenFailed = false;

        try {
            console.log("Trying @vreden/youtube_scraper for", url);
            // First get 720p
            const video720 = await ytmp4(url, 720);
            if (video720 && video720.status && video720.download?.url) {
                title = video720.metadata?.title || title;
                thumbnail = video720.metadata?.thumbnail || thumbnail;
                formats.push({
                    quality: video720.download.quality || "720p",
                    type: "video",
                    url: video720.download.url
                });
            }
            // Get 360p as fallback/option
            const video360 = await ytmp4(url, 360);
            if (video360 && video360.status && video360.download?.url) {
                title = video360.metadata?.title || title;
                thumbnail = video360.metadata?.thumbnail || thumbnail;
                if (!formats.some(f => f.url === video360.download.url)) {
                   formats.push({
                       quality: video360.download.quality || "360p",
                       type: "video",
                       url: video360.download.url
                   });
                }
            }
            // Get audio
            const audio = await ytmp3(url);
            if (audio && audio.status && audio.download?.url) {
                title = audio.metadata?.title || title;
                thumbnail = audio.metadata?.thumbnail || thumbnail;
                formats.push({
                    quality: audio.download.quality || "Audio",
                    type: "audio",
                    url: audio.download.url
                });
            }
        } catch (vredenErr: any) {
            console.error("vreden scraper failed:", vredenErr.message);
            vredenFailed = true;
        }

        if (!thumbnail) {
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
            if (match && match[1]) {
                thumbnail = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
            }
        }

        if (formats.length > 0) {
            return res.json({
                success: true,
                media_type: "video_formats",
                thumbnail_url: thumbnail,
                download_url: formats[0].url,
                title: title,
                formats: formats
            });
        }

        console.log("Falling back to yt-dlp for", url);
        const youtubedl = (await import('youtube-dl-exec')).default;
        
        let info: any = null;
        try {
          const ytDlpOptions: any = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
            extractorArgs: 'youtube:player_client=default,ios'
          };
          
          const fs = await import('fs');
          const path = await import('path');
          const cookiesPath = path.join(process.cwd(), 'cookies.txt');
          if (fs.existsSync(cookiesPath)) {
             ytDlpOptions.cookies = cookiesPath;
          }
          
          info = await youtubedl(url, ytDlpOptions);
        } catch (ytErr: any) {
          const errMsg = ytErr.message || ytErr;
          if (typeof errMsg === 'string' && errMsg.includes("Sign in to confirm you’re not a bot")) {
             console.warn("youtube-dl-exec bot detection triggered for", url);
          } else {
             console.error("youtube-dl-exec failed:", errMsg);
          }

          try {
            console.log("Falling back to oembed for", url);
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              return res.json({
                success: true,
                media_type: "video_formats",
                thumbnail_url: oembedData.thumbnail_url,
                title: oembedData.title,
                formats: [],
                message: "YouTube bot protection is currently preventing video downloads for this link. You can still download the thumbnail."
              });
            }
          } catch (oembedErr) {
            console.warn("Oembed fallback failed. No formats could be extracted.");
          }
          
          return res.status(403).json({ error: "YouTube bot detection blocked the download. Please try another video." });
        }
        
        const availableFormats: {quality: string, type: string, url: string}[] = [];
        
        if (info.formats) {
            const videoAudioFormats = info.formats.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4');
            const qualities = ["1080p", "720p", "480p", "360p"];
            
            for (const quality of qualities) {
                const format = videoAudioFormats.find((f: any) => f.format_note && f.format_note.includes(quality.replace("p", "")));
                if (format && format.url) {
                    availableFormats.push({
                        quality: quality,
                        type: "video",
                        url: format.url
                    });
                }
            }
            
            if (availableFormats.length === 0 && videoAudioFormats.length > 0) {
                const best = videoAudioFormats[0];
                if (best.url) {
                    availableFormats.push({
                        quality: best.format_note || "Best Video",
                        type: "video",
                        url: best.url
                    });
                }
            }
            
            const audioFormats = info.formats.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none');
            if (audioFormats.length > 0) {
                const bestAudio = audioFormats.find((f: any) => f.ext === 'm4a') || audioFormats[0];
                if (bestAudio && bestAudio.url) {
                    availableFormats.push({
                        quality: "Audio (MP3/M4A)",
                        type: "audio",
                        url: bestAudio.url
                    });
                }
            }
        } else if (info.url) {
            availableFormats.push({
               quality: info.format_note || info.format || "Best (Auto)",
               type: "video",
               url: info.url
           });
        }
        
        if (availableFormats.length === 0) {
            return res.json({ success: false, message: "YouTube is temporarily blocking this download. Try again later." });
        }

        let thumbnail_url = info.thumbnail || "";

        return res.json({ 
            success: true, 
            media_type: "video_formats", 
            title: info.title || "YouTube Video",
            thumbnail_url, 
            formats: availableFormats 
        });
      } catch (err: any) {
        console.error("youtube-dl Error:", err.message);
        return res.json({ success: false, message: "YouTube download failed: " + err.message });
      }
    }
  } catch (error: any) {
    console.error("YT Media Error:", error);
    return res.status(500).json({ error: "Failed to fetch YouTube media" });
  }
});


app.post("/api/yt-channel", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const YT_API_KEY = "AIzaSyAUwcNeNmuhMP4POnh2W6-u_Yx9vOvnVxM";
    let apiFetchUrl = "";
    
    if (url.includes("/channel/UC")) {
        const id = url.split("/channel/")[1].split("?")[0].split("/")[0];
        apiFetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${id}&key=${YT_API_KEY}`;
    } else if (url.includes("@")) {
        const handle = "@" + url.split("@")[1].split("?")[0].split("/")[0];
        apiFetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forHandle=${handle}&key=${YT_API_KEY}`;
    } else if (url.includes("/user/")) {
        const user = url.split("/user/")[1].split("?")[0].split("/")[0];
        apiFetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forUsername=${user}&key=${YT_API_KEY}`;
    } else if (url.includes("/c/")) {
        const handle = "@" + url.split("/c/")[1].split("?")[0].split("/")[0];
        apiFetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forHandle=${handle}&key=${YT_API_KEY}`;
    }
    
    let dp_url = "";
    let banner_url = "";
    let title = "";
    
    if (apiFetchUrl) {
       try {
           const apiRes = await fetch(apiFetchUrl);
           const apiData = await apiRes.json();
           if (apiData.items && apiData.items.length > 0) {
               const item = apiData.items[0];
               title = item.snippet?.title || "YouTube Channel";
               dp_url = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "";
               banner_url = item.brandingSettings?.image?.bannerExternalUrl || "";
               if (banner_url) {
                   banner_url += "=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj";
               }
           }
       } catch (e) {
           console.error("YouTube API failed, falling back to scraping", e);
       }
    }
    
    if (!dp_url || !banner_url || !title) {
      let html = "";
      try {
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(40000);
        await page.goto(url, { waitUntil: 'networkidle2' });
        html = await page.content();
        await page.close();
      } catch (err) {
        console.error("Puppeteer error on YT channel:", err);
        const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        html = await fetchRes.text();
      }

      const $ = cheerio.load(html);
      if (!dp_url) dp_url = $('meta[property="og:image"]').attr('content') || "";
      if (!title) title = $('meta[property="og:title"]').attr('content') || $('title').text() || "YouTube Channel";

      if (!banner_url) {
        const match = html.match(/var ytInitialData = (\{.*?\});/);
        if (match) {
            const data = JSON.parse(match[1]);
            const header = data.header?.c4TabbedHeaderRenderer || data.header?.pageHeaderRenderer;
            
            const findBanner = (obj: any): string | null => {
                if (!obj) return null;
                if (typeof obj !== 'object') return null;
                if (obj.banner?.thumbnails) {
                    const thumbs = obj.banner.thumbnails;
                    return thumbs[thumbs.length - 1].url;
                }
                if (obj.tvBanner?.thumbnails) {
                    const thumbs = obj.tvBanner.thumbnails;
                    return thumbs[thumbs.length - 1].url;
                }
                if (obj.image?.thumbnails) {
                    const thumbs = obj.image.thumbnails;
                    return thumbs[thumbs.length - 1].url;
                }
                for (const key in obj) {
                    const found = findBanner(obj[key]);
                    if (found) return found;
                }
                return null;
            }

            banner_url = findBanner(header) || findBanner(data) || "";
        }
      }
    }

    if (!dp_url && !banner_url) {
        return res.status(404).json({ error: "Could not extract channel details" });
    }

    return res.json({ success: true, title, dp_url, banner_url });
  } catch (error: any) {
    console.error("YT Channel Error:", error);
    return res.status(500).json({ error: "Failed to fetch YouTube channel details" });
  }
});

app.post("/api/audio-hub", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const ytDlpOptions: any = {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      ]
    };

    const info: any = await youtubedl(url, ytDlpOptions);
    
    let audioFormats = [];
    if (info.formats) {
       audioFormats = info.formats
           .filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none')
           .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))
           .slice(0, 3)
           .map((f: any) => ({
               quality: f.abr ? `${f.abr}kbps` : 'Audio',
               type: 'audio',
               url: f.url
           }));
    } else if (info.url) {
       audioFormats.push({ quality: 'Audio', type: 'audio', url: info.url });
    }
    
    if (audioFormats.length === 0) {
        return res.status(404).json({ error: "No audio stream found for this link." });
    }

    return res.json({
      success: true,
      type: "audio",
      title: info.title || "Extracted Audio",
      thumbnail_url: info.thumbnail || "",
      formats: audioFormats
    });

  } catch (err: any) {
    console.error("Audio Hub Error:", err.message);
    return res.status(500).json({ error: "Failed to extract audio: " + err.message });
  }
});

app.post("/api/yt-playlist", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const ytDlpOptions: any = {
      dumpSingleJson: true,
      flatPlaylist: true,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      ]
    };

    const info: any = await youtubedl(url, ytDlpOptions);
    
    if (!info.entries || info.entries.length === 0) {
        return res.status(404).json({ error: "No items found in this playlist, or the playlist is private." });
    }

    const playlistItems = info.entries.map((item: any) => ({
       title: item.title,
       url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
       duration: item.duration,
       id: item.id
    }));

    return res.json({
      success: true,
      type: "playlist",
      title: info.title || "YouTube Playlist",
      thumbnail_url: info.thumbnail || "",
      playlistItems
    });

  } catch (err: any) {
    console.error("Playlist Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch playlist: " + err.message });
  }
});

app.post("/api/universal-dl", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const ytDlpOptions: any = {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:google.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      ]
    };

    const info: any = await youtubedl(url, ytDlpOptions);
    
    let formats = [];
    if (info.formats) {
       formats = info.formats
           .filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none')
           .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))
           .map((f: any) => {
               let q = f.format_note || f.resolution || (f.height ? `${f.height}p` : '');
               if (!q && f.vcodec !== 'none') q = 'Video';
               if (!q && f.acodec !== 'none') q = 'Audio';
               
               return {
                   quality: q,
                   type: f.vcodec !== 'none' ? 'video' : 'audio',
                   url: f.url
               };
           });
       
       // Deduplicate by quality
       formats = formats.filter((v: any, i: number, a: any) => a.findIndex((t: any) => (t.quality === v.quality && t.type === v.type)) === i);
    } else if (info.url) {
       formats.push({ quality: 'Default', type: 'video', url: info.url });
    }
    
    if (formats.length === 0) {
        return res.status(404).json({ error: "No media stream found for this link." });
    }

    return res.json({
      success: true,
      type: formats.some((f: any) => f.type === 'video') ? "video" : "audio",
      title: info.title || "Extracted Media",
      thumbnail_url: info.thumbnail || "",
      formats: formats.slice(0, 15) // Limit to top 15 formats
    });

  } catch (err: any) {
    console.error("Universal DL Error:", err.message);
    return res.status(500).json({ error: "Failed to extract media: " + err.message });
  }
});

app.post("/api/yt-community", async (req, res) => {
  console.log("Called /api/yt-community with:", req.body);
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } });
    const html = await fetchRes.text();

    let data;
    const match = html.match(/var ytInitialData = (\{.*?\});/);
    if (match) {
        data = JSON.parse(match[1]);
    } else {
        const match2 = html.match(/window\["ytInitialData"\] = (\{.*?\});/);
        if (match2) data = JSON.parse(match2[1]);
    }

    if (!data) return res.status(404).json({ error: "Could not find ytInitialData" });

    const posts: any[] = [];
    const extractPosts = (obj: any) => {
        if (!obj) return;
        if (typeof obj !== 'object') return;
        
        if (obj.backstagePostThreadRenderer?.post?.backstagePostRenderer || obj.backstagePostThreadRenderer?.post?.sharedPostRenderer) {
            let post = obj.backstagePostThreadRenderer.post.backstagePostRenderer;
            let isShared = false;
            
            if (!post && obj.backstagePostThreadRenderer.post.sharedPostRenderer) {
                 post = obj.backstagePostThreadRenderer.post.sharedPostRenderer;
                 isShared = true;
            }

            // Extract text
            let text = "";
            if (post.contentText?.runs) {
                text = post.contentText.runs.map((r: any) => r.text).join("");
            } else if (post.content?.runs) {
                text = post.content.runs.map((r: any) => r.text).join("");
            }
            
            const postId = post.postId;
            let images: string[] = [];
            
            // Check attachments
            const attachment = post.backstageAttachment || (isShared && post.originalPost?.backstagePostRenderer?.backstageAttachment);
            
            if (attachment?.backstageImageRenderer) {
                const img = attachment.backstageImageRenderer;
                if (img.image?.thumbnails) {
                    images.push(img.image.thumbnails[img.image.thumbnails.length - 1].url);
                }
            } else if (attachment?.postMultiImageRenderer) {
                const multi = attachment.postMultiImageRenderer.images;
                if (multi) {
                    multi.forEach((imgObj: any) => {
                        const img = imgObj.backstageImageRenderer;
                        if (img?.image?.thumbnails) {
                            images.push(img.image.thumbnails[img.image.thumbnails.length - 1].url);
                        }
                    });
                }
            }
            
            posts.push({ id: postId, text, images });
        }
        
        if (Array.isArray(obj)) {
            obj.forEach(extractPosts);
        } else {
            for (const key in obj) {
                extractPosts(obj[key]);
            }
        }
    }

    extractPosts(data);

    return res.json({ success: true, posts });

  } catch (error: any) {
    console.error("YT Community Error:", error);
    return res.status(500).json({ error: "Failed to fetch YouTube community posts" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
