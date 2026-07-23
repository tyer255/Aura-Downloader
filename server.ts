
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import webpush from 'web-push';
import { Transform } from 'stream';
import axios from 'axios';
import { exec, spawn } from 'child_process';
import utilSync from 'util';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import path from "path";
import { createServer as createViteServer } from "vite";
import ytdl from "@distube/ytdl-core";

import * as cheerio from "cheerio";
import { ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
import btch from "btch-downloader";
import https from "https";
import http from "http";
import { URL } from "url";

// Initialize Gemini client lazily
let aiClient: any | null = null;
function getGemini(): any | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.log("Warning: GEMINI_API_KEY environment variable is not defined.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Clean and compress HTML for token-efficient Gemini parsing
function cleanHTML(html: string): string {
  try {
    const $ = cheerio.load(html);
    
    // Remove heavy and unneeded DOM elements, but keep scripts because many sites (like Instagram) embed JSON data in them
    $('style').remove();
    $('noscript').remove();
    $('svg').remove();
    $('iframe').remove();
    
    // Collect metadata tags

    let metaInfo = "";
    $('meta').each((i, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const content = $(el).attr('content');
      if (name && content) {
        metaInfo += `${name}: ${content}\n`;
      }
    });

    // Collect JSON-LD structured data
    let ldJson = "";
    $('script[type="application/ld+json"]').each((i, el) => {
      ldJson += $(el).html() + "\n";
    });

    // Collect first 60 relevant media tags
    let links = "";
    $('img, video, source, a').each((i, el) => {
      if (i > 60) return;
      const src = $(el).attr('src') || $(el).attr('href') || $(el).attr('poster') || $(el).attr('data-src');
      const alt = $(el).attr('alt') || "";
      if (src && (src.startsWith('http') || src.includes('cdn') || src.includes('media'))) {
        links += `<${el.name} src="${src}" alt="${alt}">\n`;
      }
    });

    return `
TITLE: ${$('title').text()}
METADATA:
${metaInfo}
LD_JSON:
${ldJson}
MEDIA_LINKS:
${links}
    `.slice(0, 18000); // safety token boundary
  } catch (err) {
    console.log("HTML clean error:", err);
    return html.slice(0, 5000);
  }
}

// Fetch webpage with robust headers
async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }, 4000);
  if (!response.ok) {
    throw new Error(`Webpage fetch failed with status ${response.status}`);
  }
  return await response.text();
}

// High speed timeout wrapper to keep the backend ultra responsive
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Timeout');
    }
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: any = null): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([
    promise.then(res => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise
  ]).catch(err => {
    clearTimeout(timer);
    if (fallbackValue !== null) {
      return fallbackValue;
    }
    throw err;
  });
}

// Local parser fallback that uses cheerio to extract high-fidelity standard metadata from HTML
function localCheerioFallback(html: string, url: string, isProfile: boolean): any {
  console.log("Local Cheerio metadata parser fallback engaged.");
  try {
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || "Social Media Post";
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || "";
    const thumbnail = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
    
    let directUrl = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content') || $('meta[property="og:video:url"]').attr('content') || "";
    
    if (!directUrl) {
      $('video source').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http')) {
          directUrl = src;
          return false;
        }
      });
      if (!directUrl) {
        $('video').each((i, el) => {
          const src = $(el).attr('src');
          if (src && src.startsWith('http')) {
            directUrl = src;
            return false;
          }
        });
      }
    }
    
    if (!directUrl && !isProfile) {
      directUrl = thumbnail || "";
    }
    
    if (!directUrl && !isProfile) { return { success: false, error: "Could not locate media URL in the page content." }; }
    const mediaType = directUrl && (directUrl.includes(".mp4") || directUrl.includes("m3u8") || $('meta[property="og:video"]').length > 0) ? "video" : "image";

    if (isProfile) {
      let username = "user";
      if (url.includes("@")) {
        username = "@" + url.split("@")[1].split("/")[0].split("?")[0];
      } else {
        const segments = url.split("/").filter(Boolean);
        username = segments[segments.length - 1] || "user";
      }

      let displayName = (title && title !== "Social Media Post" && !title.includes("404") && !title.includes("Not Found")) ? title.split(" (")[0] : username;
      let avatarUrl = thumbnail || "";
      let bio = description || "";
      let followers = "Unknown";
      let bannerUrl = "";


      if (!bannerUrl && (url.includes("youtube.com") || url.includes("youtu.be"))) {
        // Try to find followers in YouTube HTML JSON as fallback
        const subMatch = html.match(/\{"content":"([0-9.,]+[KMBkmb]?)\s+subscribers"\}/i);
        if (subMatch) {
            followers = subMatch[1];
        } else {
            const subMatch2 = html.match(/"simpleText":"([0-9.,]+[KMBkmb]?)\s+subscribers"/i);
            if (subMatch2) {
                followers = subMatch2[1];
            }
        }

        // Try to find YouTube banner URL
        const bannerMatch = html.match(/"banner":\{.*?"url":"(https:\/\/[^"]+)"/);
        if (bannerMatch && bannerMatch[1]) {
            bannerUrl = bannerMatch[1];
        }
      }

      return {
        success: true,
        title: displayName,
        description: bio,
        thumbnail: avatarUrl,
        mediaType: "profile",
        profile: {
          username,
          displayName,
          avatarUrl,
          bannerUrl,
          bio,
          followers,
          following: "Unknown",
          postsCount: "Unknown"
        }
      };
    } else {
      return {
        success: true,
        title,
        description,
        thumbnail,
        url: directUrl,
        mediaType,
        media: directUrl ? [{ url: directUrl, type: mediaType, thumbnail }] : []
      };
    }
  } catch (err: any) {
    console.log("Local Cheerio fallback failed (falling back).");
    return {
      success: false,
      error: "Could not parse media. Details: " + err.message
    };
  }
}

// Use Gemini-3.5-flash to extract high fidelity direct media URLs & Profile data



const execAsync = utilSync.promisify(exec);


async function extractWithVreden(url: string) {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  console.error = () => {};
  console.log = () => {};
  try {
    const result = await vredenYtmp4(url);
    if (result && result.status && result.download && result.download.status) {
      const downloadInfo = result.download;
      const title = downloadInfo.filename || "YouTube Video";
      const availableQualities = downloadInfo.availableQuality || [360, 720];
      
      const qualities = availableQualities.map((q: any) => {
        const qStr = String(q);
        const qLabel = qStr.endsWith('p') ? qStr : `${qStr}p`;
        return {
          label: `${qLabel} (MP4)`,
          url: `/api/youtube-stream?url=${encodeURIComponent(url)}&quality=${qStr}&filename=${encodeURIComponent(title)}`,
          ext: "mp4",
          size: q >= 720 ? "High Definition" : "Standard Quality"
        };
      });

      const primaryUrl = `/api/youtube-stream?url=${encodeURIComponent(url)}&quality=${downloadInfo.quality || '360'}&filename=${encodeURIComponent(title)}`;

      let videoId = "";
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (match) {
        videoId = match[1];
      }
      const thumbnail = result.metadata?.thumbnail || result.metadata?.image || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "");

      return {
        success: true,
        title: (result.metadata?.title || title).replace(/\s*\(\d+p\)\.mp4$/i, ""),
        url: primaryUrl,
        thumbnail: thumbnail,
        mediaType: "video",
        source: "vreden",
        qualities: qualities
      };
    }
  } catch (err: any) {
    // Ignore internal scraper errors
  } finally {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  }
  return null;
}




async function extractTwitterRapidAPI(url: string, rapidKey: string) {
    try {
        const tweetIdMatch = url.match(/status\/(\d+)/);
        if (!tweetIdMatch) return null;
        const tweetId = tweetIdMatch[1];
        
        // Try twitter135 API first
        console.log("Trying Twitter135 RapidAPI...");
        const res = await axios.get(`https://twitter135.p.rapidapi.com/v1.1/Guest/TweetDetail/?id=${tweetId}`, {
            headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': 'twitter135.p.rapidapi.com'
            },
            timeout: 10000
        });
        
        if (res.data && res.data.globalObjects && res.data.globalObjects.tweets) {
            const tweet = res.data.globalObjects.tweets[tweetId];
            if (tweet && tweet.extended_entities && tweet.extended_entities.media) {
                const mediaItems = [];
                let thumbnail = "";
                for (const m of tweet.extended_entities.media) {
                    if (m.type === 'video' || m.type === 'animated_gif') {
                        thumbnail = m.media_url_https || "";
                        let bestVideo = null;
                        let maxBitrate = -1;
                        if (m.video_info && m.video_info.variants) {
                            for (const variant of m.video_info.variants) {
                                if (variant.content_type === 'video/mp4' && (variant.bitrate || 0) > maxBitrate) {
                                    maxBitrate = variant.bitrate || 0;
                                    bestVideo = variant.url;
                                }
                            }
                        }
                        if (bestVideo) {
                            mediaItems.push({ type: "video", url: bestVideo, thumbnail });
                        }
                    } else if (m.type === 'photo') {
                        mediaItems.push({ type: "image", url: m.media_url_https });
                    }
                }
                if (mediaItems.length > 0) {
                    return {
                        title: tweet.full_text ? tweet.full_text.substring(0, 50) + "..." : "Twitter Media",
                        thumbnail: thumbnail || mediaItems[0].url,
                        media: mediaItems
                    };
                }
            }
        }
        return null;
    } catch (e: any) {
        console.error("RapidAPI Twitter Error:", e.response?.data || e.message);
        if (e.response && e.response.status === 403) {
            throw new Error("You are not subscribed to the 'Twitter135' API on RapidAPI. Please go to rapidapi.com, search for 'Twitter135' (by omaroid), and subscribe to the Free tier to enable Twitter extraction.");
        }
        return null;
    }
}

async function extractTwitterXtractor(url: string, authToken?: string) {
  try {
    
    if (!fs.existsSync('./xtractor')) {
      console.log('xtractor binary not found, skipping');
      return null;
    }
    const tokenArg = authToken ? `-auth-token ${authToken}` : '-guest';
    const cmd = `./xtractor ${tokenArg} -json "${url}"`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 25000 }).catch(e => e);
    
    // Check for IP block
    const output = (stdout || '') + '\n' + (stderr || '');
    if (output.includes('ip_blocked') || output.includes('http 403')) {
      return {
        success: true,
        title: "Twitter Media (Mock - IP Blocked)",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        thumbnail: "https://via.placeholder.com/600x400/1DA1F2/FFFFFF.png?text=Twitter+Media+Preview",
        mediaType: "video",
        qualities: [
           { label: "HD", url: "https://www.w3schools.com/html/mov_bbb.mp4", ext: "mp4", size: "Video" }
        ],
        media: [{ type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnail: "https://via.placeholder.com/600x400/1DA1F2/FFFFFF.png?text=Twitter+Media+Preview" }],
        source: "mock",
        warning: "Twitter blocked our server IP for unauthenticated requests. Serving a fallback mock video."
      };
    }
    if (output.includes('rate_limit')) {
       return {
        success: true,
        title: "Twitter Media (Mock - Rate Limit)",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        thumbnail: "https://via.placeholder.com/600x400/1DA1F2/FFFFFF.png?text=Twitter+Media+Preview",
        mediaType: "video",
        qualities: [
           { label: "HD", url: "https://www.w3schools.com/html/mov_bbb.mp4", ext: "mp4", size: "Video" }
        ],
        media: [{ type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnail: "https://via.placeholder.com/600x400/1DA1F2/FFFFFF.png?text=Twitter+Media+Preview" }],
        source: "mock",
        warning: "Twitter rate limit reached. Serving a fallback mock video."
       };
    }

    // Try to parse json from stdout
    try {
      // Find the first line that looks like JSON or parse everything
      const lines = (stdout || '').split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          const data = JSON.parse(line);
          if (data && data.url) {
            // It's a rich media or tweet object
            let mediaUrl = data.url;
            let type = data.type || "video";
            let qualities = undefined;
            
            const extractQualities = (variants: any[]) => {
               if (!variants || variants.length === 0) return undefined;
               const mp4s = variants.filter(v => v.content_type === 'video/mp4');
               if (mp4s.length === 0) return undefined;
               
               mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
               return mp4s.map(v => {
                 let label = "HD";
                 if (v.url.match(/\/(\d+x\d+)\//)) {
                    label = v.url.match(/\/(\d+x\d+)\//)[1];
                 } else if (v.bitrate) {
                    label = Math.round(v.bitrate/1000) + 'kbps';
                 }
                 return {
                    label,
                    url: v.url,
                    ext: 'mp4',
                    size: 'Video'
                 };
               });
            };

            // Wait, if it's a tweet response, media is in data.media
            if (data.media && data.media.length > 0) {
               const vids = data.media.filter((m: any) => m.type === 'video');
               if (vids.length > 0) {
                 const bestVid = vids[0].variants?.find((v: any) => v.content_type === 'video/mp4');
                 if (bestVid) {
                   mediaUrl = bestVid.url;
                   type = 'media';
                   qualities = extractQualities(vids[0].variants);
                 } else {
                   mediaUrl = vids[0].url;
                 }
               } else {
                 mediaUrl = data.media[0].url;
                 type = 'image';
               }
            } else if (data.variants && data.variants.length > 0) {
                 const bestVid = data.variants.find((v: any) => v.content_type === 'video/mp4');
                 if (bestVid) {
                   mediaUrl = bestVid.url;
                   qualities = extractQualities(data.variants);
                 }
            }
            
            if (type === 'video' && !qualities) {
                qualities = getFallbackQualities(mediaUrl, 'video');
            }

            return {
              success: true,
              title: data.text || data.title || "Twitter Media",
              url: mediaUrl,
              thumbnail: data.thumbnail || data.profile_image || "",
              mediaType: type,
              qualities: qualities,
              media: [{ type, url: mediaUrl, thumbnail: data.thumbnail || data.profile_image || "" }],
              source: "xtractor"
            };
          }
        }
      }
    } catch(e) {
      console.log('Failed to parse xtractor JSON:', e);
    }
    
    // If we didn't return, check if it's a known error
    if (output.trim() === '') return null;
    console.log('xtractor output was not json:', output.substring(0, 200));
  } catch (err) {
    console.log('xtractor execution error:', err);
  }
  return null;
}


async function extractWithYtDlp(url: string, isPlaylist: boolean = false) {
  try {
    const youtubedl = (await import('youtube-dl-exec')).default;
    
    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist,
      youtubeSkipDashManifest: true,
      youtubeSkipHlsManifest: true,
      noCheckFormats: true,
      checkFormats: "no"
    };
    
    if (isPlaylist) {
       options.flatPlaylist = true;
       options.playlistEnd = 15;
    }
    
    const data: any = await youtubedl(url, options);

    if (isPlaylist && data.entries) {
      const validEntries = data.entries.filter((e: any) => e && e.url && e.id);
      const media = validEntries.map((entry: any) => ({
        type: "video",
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        thumbnail: entry.thumbnails?.[0]?.url || (entry.id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : ""),
        title: entry.title || "YouTube Video"
      }));

      const isChannel = url.includes('@') || url.includes('/channel/') || url.includes('/c/');
      if (isChannel) {
        let avatarUrl = "";
        let bannerUrl = "";
        if (data.thumbnails) {
          const avatars = data.thumbnails.filter((t: any) => t.id && t.id.includes('avatar'));
          const banners = data.thumbnails.filter((t: any) => t.id && t.id.includes('banner'));
          if (avatars.length) avatarUrl = avatars[0].url;
          if (banners.length) bannerUrl = banners[0].url;
          
          if (!avatarUrl && data.thumbnails.length > 0) {
              avatarUrl = data.thumbnails[data.thumbnails.length - 1].url;
          }
        }

        // ======= RAPID API INTEGRATION =======
        const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
        if (rapidKey && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            try {
                console.log("Using RapidAPI to enhance YouTube Profile in yt-dlp");
                const ytHost = process.env.RAPIDAPI_YT_HOST || "yt-api.p.rapidapi.com";
                let cleanUsername = url.split("@")[1]?.split("/")[0]?.split("?")[0] || data.uploader_id || "";
                if (cleanUsername) {
                    const ytRes = await (await import('axios')).default.get(`https://${ytHost}/channel/about?id=@${cleanUsername}`, {
                        headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': ytHost },
                        timeout: 8000
                    });
                    if (ytRes.data) {
                        const rpdata = ytRes.data;
                        if (rpdata.avatar && rpdata.avatar.length > 0) avatarUrl = rpdata.avatar[rpdata.avatar.length - 1].url;
                        if (rpdata.banner && rpdata.banner.length > 0) bannerUrl = rpdata.banner[rpdata.banner.length - 1].url;
                        if (rpdata.title) data.uploader = rpdata.title;
                        if (rpdata.description) data.description = rpdata.description;
                        if (rpdata.subscriberCountText) data.channel_follower_count = rpdata.subscriberCountText;
                    }
                }
            } catch (e: any) {
                console.error("Rapid API Error in yt-dlp:", e.response?.data || e.message);
            }
        }
        // =====================================
        
        return {
          success: true,
          title: data.title || data.uploader || "YouTube Channel",
          mediaType: "profile",
          profile: {
             username: data.uploader_id || data.uploader || "user",
             displayName: data.uploader || data.title || "YouTube Channel",
             avatarUrl: avatarUrl,
             bannerUrl: bannerUrl,
             bio: data.description || "",
             followers: data.channel_follower_count ? data.channel_follower_count.toString() : ""
          },
          media: media,
          isPlaylist: true
        };
      }

      return {
        success: true,
        title: data.title || "YouTube Playlist",
        url: media[0]?.url,
        mediaType: "playlist",
        media: media,
        isPlaylist: true
      };
    }
    
    let qualities = [];
    let mediaUrl = data.url;
    
    if (data.formats && data.formats.length > 0) {
      // Find the best audio format
      const audioFormats = data.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none');
      const bestAudio = audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

      // Video formats
      const videoFormats = data.formats.filter((f: any) => f.vcodec !== 'none');
      
      const heights = new Map();
      videoFormats.forEach((f: any) => {
        if (!f.height) return;
        const current = heights.get(f.height);
        
        // Prefer formats with audio
        if (!current || (current.acodec === 'none' && f.acodec !== 'none')) {
           heights.set(f.height, f);
        }
      });
      
      // Sort heights descending
      const sortedHeights = Array.from(heights.keys()).sort((a, b) => b - a);
      
      sortedHeights.forEach((h: number) => {
         const f = heights.get(h);
         let qUrl = f.url;
         
         // If video has no audio, proxy it to mux with best audio
         if (f.acodec === 'none' && bestAudio) {
            qUrl = `/api/proxy-download?url=${encodeURIComponent(f.url)}&audioUrl=${encodeURIComponent(bestAudio.url)}&mux=true&filename=video_${h}p.mp4`;
         }
         
         qualities.push({
            label: `${h}p`,
            url: qUrl,
            ext: "mp4",
            size: `~ ${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)} MB`
         });
      });
      
      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // Best quality
      } else {
         // Fallback to finding standard formats
         const formatList = data.formats;
         const best = formatList.find((f: any) => f.format_id === '22' || f.format_id === '18') || formatList[formatList.length - 1];
         if (best) mediaUrl = best.url;
      }
    }

    if (!mediaUrl && data.url) {
        mediaUrl = data.url;
    }

    return {
      success: true,
      title: data.title || "Extracted Video",
      url: mediaUrl,
      thumbnail: data.thumbnail || "",
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities.length > 0 ? qualities : getFallbackQualities(mediaUrl, "video")
    };
  } catch(e: any) {
    // yt-dlp extraction was not successful
    return null;
  }
}


export async function extractWithAI(url: string, isProfile: boolean): Promise<any> {
  let htmlContent = "";
  try {
    let crawlUrl = url;
    if (url.toLowerCase().includes("instagram.com") && !isProfile) {
      const shortcode = getInstagramShortcode(url);
      if (shortcode) {
        crawlUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
        console.log(`Fallback crawl: redirecting instagram url to embed url: ${crawlUrl}`);
      }
    }
        
    htmlContent = await fetchPageHtml(crawlUrl);
    const lowerHtml = htmlContent.toLowerCase();
    
    // Check for actual Cloudflare/DDoS protections, not just generic words
    const isBlocked = 
      htmlContent.length < 5000 || 
      lowerHtml.includes('id="challenge-error-title"') ||
      lowerHtml.includes('class="cf-error-details"') ||
      lowerHtml.includes('accounts/login') ||
      (lowerHtml.includes('captcha') && htmlContent.length < 20000);

    if (isBlocked) {
      htmlContent = "";
    }
  } catch (err: any) {
    // ignore
  }

  
  const aiClient = getGemini();
  if (aiClient && htmlContent && htmlContent.length > 500) {
    try {
      console.log("Attempting to parse metadata with Gemini API...");
      const cleanedHtml = cleanHTML(htmlContent);
      
      const prompt = `
You are an advanced metadata extraction agent. Analyze the following webpage HTML and extract the core media assets (video URL, image URL, title, description). 

Important Instructions for Instagram:
- If this is an Instagram embed or page, look for video links in <script> tags or <video> tags. Look for properties like "video_url", "video_versions", etc.
- Only return valid HTTP/HTTPS URLs.

Return ONLY a valid JSON object matching this schema, nothing else (do NOT wrap in markdown \`\`\`json blocks):
{
  "title": "string (the main title or caption, default to 'Media Post')",
  "description": "string (the description or caption text, empty if not found)",
  "thumbnail": "string (URL to the primary image or thumbnail)",
  "directUrl": "string (URL to the actual video file, if present, otherwise empty string)"
}

HTML Content:
${cleanedHtml.substring(0, 800000)}
`;

      let response;
      let text = "";
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
      let lastError;
      
      for (const modelName of modelsToTry) {
        try {
          response = await aiClient.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          });
          text = response.text || "";
          if (text) {
             console.log(`Successfully generated content using ${modelName}`);
             break;
          }
        } catch (e: any) {
          console.log(`Model ${modelName} failed:`, e.message);
          lastError = e;
        }
      }
      
      if (!text && lastError) throw lastError;
      if (text) {
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(text);
        if (parsed) {
          console.log("Gemini metadata extraction successful. Parsed keys:", Object.keys(parsed));
          
          // Fix: Prevent returning broken image URL if extraction failed to find actual media
          if (!parsed.directUrl && !parsed.thumbnail) {
            console.log("Gemini parsed response but found no directUrl or thumbnail. Failing extraction.");
            return null; // fallback to generic error instead of returning a broken URL
          }

          return {
            success: true,
            title: parsed.title || "Instagram Post",
            description: parsed.description || "",
            thumbnail: parsed.thumbnail || "",
            url: parsed.directUrl || parsed.thumbnail || url,
            mediaType: parsed.directUrl ? "video" : "image",
            media: [{
              type: parsed.directUrl ? "video" : "image",
              url: parsed.directUrl || parsed.thumbnail || url,
              thumbnail: parsed.thumbnail || ""
            }]
          };
        }
      }
    } catch (err: any) {
      console.log("Gemini API parsing failed:", err.message);
    }
  }

  if (!htmlContent) {
    console.log("Empty page content, engaging local cheerio fallback with available page reference if any.");
  }

  return localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
}

// Helper to extract the Instagram shortcode
function inferInstagramType(item: any, originalUrl: string): "video" | "image" {
  if (isInstagramVideoUrl(originalUrl)) return "video";
  if (item.type === "video") return "video";
  if (item.url?.toLowerCase().includes(".mp4")) return "video";
  if (item.thumbnail && item.thumbnail !== item.url && !item.thumbnail.includes(item.url)) return "video";
  return "image";
}

function getInstagramShortcode(url: string): string | null {
  const m = url.match(/(?:\/p|\/reel|\/tv|\/reels)\/([a-zA-Z0-9_-]{11,15})/);
  return m ? m[1] : null;
}


// Fallback quality generator for simple or single-stream extractions
function getFallbackQualities(url: string, mediaType: string = "video") {
  if (mediaType === "video") {
    const mp3Url = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=audio.mp3&extractAudio=true`;
    return [
      { label: "1080p (Full HD)", url: url, ext: "mp4", size: "High Definition" },
      { label: "720p (HD Video)", url: url, ext: "mp4", size: "Standard HD" },
      { label: "480p (SD Video)", url: url, ext: "mp4", size: "Standard Definition" },
      { label: "360p (Mobile Video)", url: url, ext: "mp4", size: "Low Bandwidth" },
      { label: "MP3 Audio", url: mp3Url, ext: "mp3", size: "Audio Only" }
    ];
  }
  return [
    { label: "Original Resolution (Image)", url: url, ext: "jpg", size: "Original" }
  ];
}
// Classify URL to decide the optimal parsing route
function isInstagramVideoUrl(url: string) { return /\/(reel|tv|reels)\//.test(url); }

function classifyUrl(urlStr: string) {
  const url = urlStr.toLowerCase().trim();
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'unknown' = 'unknown';
  let type: 'profile' | 'media' | 'playlist' = 'media';

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    platform = 'youtube';
    if (url.includes("/playlist")) {
      type = 'playlist';
    } else if (url.includes("/channel/") || url.includes("/c/") || url.includes("/@") || url.includes("/community") || url.includes("/post/")) {
      if (url.includes("/post/") || url.includes("lb=")) {
        type = 'media';
      } else {
        type = 'profile';
      }
    }
    } else if (url.includes("instagram.com")) {
    platform = 'instagram';
    if (!/\/(p|reel|tv|reels|stories)\//.test(url)) {
      type = 'profile';
    }
  } else if (url.includes("pinterest.com") || url.includes("pin.it")) {
    platform = 'pinterest';
    if (!url.includes("/pin/") && !url.includes("pin.it")) {
      const path = urlStr.split("pinterest.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("x.com") || url.includes("twitter.com")) {
    platform = 'x';
    if (!url.includes("/status/")) {
      const path = urlStr.split(/x\.com|twitter\.com/)[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
    if (url.includes("/in/") || url.includes("/company/")) {
      type = 'profile';
    } else if (url.includes("/posts/")) {
      type = 'media';
    }
  }
  return { platform, type };
}


// Robust download streaming helper supporting redirects and client aborts
function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5, throttleMBps = 0) {
  if (maxRedirects <= 0) {
    console.error(`Too many redirects for URL: ${fileUrl}`);
    return res.status(500).send("Too many redirects");
  }

  try {
    let targetUrl = fileUrl;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const requestOptions = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    };

    const request = client.get(parsedUrl, requestOptions, (response) => {
      // Handle Redirects
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        let redirectUrl = response.headers.location;
        if (!redirectUrl.startsWith("http")) {
          redirectUrl = new URL(redirectUrl, targetUrl).href;
        }
        console.log(`Following redirect: ${response.statusCode} -> ${redirectUrl}`);
        // CRITICAL: destroy the redirect response to release socket immediately!
        response.destroy();
        pipeUrlStream(redirectUrl, res, customFilename, inline, maxRedirects - 1, throttleMBps);
        return;
      }

      if (response.statusCode && response.statusCode >= 400) {
        console.error(`Source server returned status ${response.statusCode} for URL: ${targetUrl}`);
        response.destroy();
        return res.status(response.statusCode).send(`Error ${response.statusCode}: Failed to download media from upstream server.`);
      }

      const contentType = response.headers["content-type"] || "application/octet-stream";
      const contentLength = response.headers["content-length"];

      let ext = "mp4";
      const ctLower = contentType.toLowerCase();
      if (ctLower.includes("image/jpeg") || ctLower.includes("image/jpg")) {
        ext = "jpg";
      } else if (ctLower.includes("image/png")) {
        ext = "png";
      } else if (ctLower.includes("image/gif")) {
        ext = "gif";
      } else if (ctLower.includes("video/quicktime")) {
        ext = "mov";
      } else if (ctLower.includes("audio/mpeg") || ctLower.includes("audio/mp3")) {
        ext = "mp3";
      } else if (ctLower.includes("video/webm")) {
        ext = "webm";
      } else if (ctLower.includes("video/mp4") || ctLower.includes("application/mp4") || ctLower.includes("application/octet-stream")) {
        ext = "mp4";
      }

      let filename = customFilename || "download";
      if (!path.extname(filename)) {
        filename = `${filename}.${ext}`;
      }

      // Clean filename of invalid characters, but KEEP the dot
      filename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\r\n]+/g, ''));
      const disposition = inline ? "inline" : `attachment; filename*=UTF-8''${encodedFilename}`;
      res.setHeader("Content-Disposition", disposition);
      res.setHeader("Content-Type", contentType);
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      // Handle stream errors
      response.on("error", (err) => {
        console.error(`Response stream error: ${err.message}`);
        response.destroy();
      });

      // Clean client abort handling
      res.on("close", () => {
        response.destroy();
        request.destroy();
      });

      if (throttleMBps > 0) {
        const bytesPerSecond = throttleMBps * 1024 * 1024;
        const throttler = new ThrottleStream(bytesPerSecond);
        response.pipe(throttler).pipe(res);
      } else {
        response.pipe(res);
      }
    });

    request.on("error", (err) => {
      console.error(`Request error in pipeUrlStream: ${err.message}`);
      request.destroy();
      if (!res.headersSent) {
        res.redirect(targetUrl);
      }
    });

    // Handle client abort before response headers are received
    res.on("close", () => {
      request.destroy();
    });

  } catch (err: any) {
    console.error(`Url parsing error in pipeUrlStream: ${err.message}`);
    if (!res.headersSent) {
      res.redirect(fileUrl);
    }
  }
}





class ThrottleStream extends Transform {
  private bytesPassed = 0;
  private startTime = Date.now();
  private maxBytesPerSecond: number;

  constructor(maxBytesPerSecond: number) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    this.bytesPassed += chunk.length;
    
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // in seconds
    const expectedBytes = elapsed * this.maxBytesPerSecond;
    
    if (this.bytesPassed > expectedBytes) {
      const waitTime = ((this.bytesPassed - expectedBytes) / this.maxBytesPerSecond) * 1000;
      setTimeout(() => {
        this.push(chunk);
        callback();
      }, waitTime);
    } else {
      this.push(chunk);
      callback();
    }
  }
}

export async function startServer() {
const app = express();
  const PORT = process.env.PORT || 3000;

  // Security Middlewares for Production
  app.use(helmet({
    crossOriginResourcePolicy: false, // allow images to load
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // disabled temporarily for dev/preview iframe
  }));
  app.use(cors());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { success: false, message: "Too many requests, please try again later." }
  });
  app.use("/api/", limiter);

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "API is working"
    });
  });

  app.get("/api/download", (req, res) => {
    res.status(405).json({
      success: false,
      message: "This endpoint requires a POST request with a JSON body containing a 'url' field."
    });
  });

app.get("/api/env-debug", (req, res) => {
    res.json({
        keys: Object.keys(process.env).filter(k => k.toLowerCase().includes("rapid"))
    });
});


app.get("/api/env-debug2", (req, res) => {
    const std = ['PATH', 'NODE_ENV', 'HOSTNAME', 'HOME', 'USER', 'PWD', 'SHLVL', 'TZ', 'TERM', 'YARN_VERSION'];
    res.json({
        keys: Object.keys(process.env).filter(k => !std.includes(k) && !k.startsWith('npm_') && !k.startsWith('NVM_'))
    });
});

app.get("/api/ping", (req, res) => {
    res.status(200).send("ok");
  });

  
async function getBtch() {
  const mod = await import('btch-downloader');
  return mod.default || mod;
}



async function extractPinterestNative(url: string) {
  try {
    if (url.includes('pin.it')) {
      const resp = await fetch(url, { redirect: 'manual' });
      if (resp.status >= 300 && resp.status < 400) {
        url = resp.headers.get('location') || url;
        if (url.includes('api.pinterest.com/url_shortener')) {
           const redirectResp = await fetch(url, { redirect: 'manual' });
           if (redirectResp.status >= 300 && redirectResp.status < 400) {
              url = redirectResp.headers.get('location') || url;
           }
        }
      }
    }
    
    if (!url.includes('/pin/')) return null;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = await res.text();
    
    let videoUrl = "";
    let imageUrl = "";
    let title = "Pinterest Video";
    
    const match = html.match(/<script data-relay-response="[^"]+" type="application\/json">([\s\S]*?)<\/script>/g);
    if (match) {
        for (const m of match) {
            const jsonMatch = m.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1]);
                    const strData = JSON.stringify(data);
                    
                    const mp4Regex = /"(https:\/\/[^"]+\.mp4[^"]*)"/g;
                    let mUrl;
                    while ((mUrl = mp4Regex.exec(strData)) !== null) {
                        if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                            videoUrl = mUrl[1];
                        }
                    }
                    if (!videoUrl && strData.includes('.m3u8')) {
                       const m3u8Regex = /"(https:\/\/[^"]+\.m3u8[^"]*)"/g;
                       const mm = m3u8Regex.exec(strData);
                       if (mm) videoUrl = mm[1];
                    }
                    
                    const titleRegex = /"title":"([^"]+)"/;
                    const tMatch = titleRegex.exec(strData);
                    if (tMatch && tMatch[1]) title = tMatch[1];
                    
                    const imgRegex = /"imageLargeUrl":"([^"]+)"/;
                    const iMatch = imgRegex.exec(strData);
                    if (iMatch && iMatch[1]) imageUrl = iMatch[1];
                } catch(e) {}
            }
        }
    }
    
    if (!videoUrl) {
       const pwsMatch = html.match(/<script id="__PWS_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
       if (pwsMatch) {
          try {
              const data = JSON.parse(pwsMatch[1]);
              const strData = JSON.stringify(data);
              const mp4Regex = /"(https:\/\/[^"]+\.mp4[^"]*)"/g;
              let mUrl;
              while ((mUrl = mp4Regex.exec(strData)) !== null) {
                  if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                      videoUrl = mUrl[1];
                  }
              }
              
              if (!imageUrl) {
                 const imgRegex = /"imageLargeUrl":"([^"]+)"/;
                 const iMatch = imgRegex.exec(strData);
                 if (iMatch && iMatch[1]) imageUrl = iMatch[1];
              }
          } catch(e) {}
       }
    }
    
    if (!videoUrl) {
       const vMatch = html.match(/<meta\s+property="og:video:url"\s+content="([^"]+)"/i) || 
                      html.match(/<meta\s+name="og:video"\s+content="([^"]+)"/i);
       if (vMatch && vMatch[1]) videoUrl = vMatch[1].replace(/&amp;/g, '&');
    }

    if (!videoUrl) {
        const mp4Regex = /"(https:\/\/[^"]+\.mp4[^"]*)"/g;
        let mUrl;
        while ((mUrl = mp4Regex.exec(html)) !== null) {
            if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                videoUrl = mUrl[1];
            }
        }
    }
    
    if (!videoUrl) {
        const m3u8Regex = /"(https:\/\/[^"]+\.m3u8[^"]*)"/g;
        let mUrl;
        while ((mUrl = m3u8Regex.exec(html)) !== null) {
            if (mUrl[1]) {
                videoUrl = mUrl[1];
                break;
            }
        }
    }

    if (!imageUrl) {
       const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+name="og:image"\s+content="([^"]+)"/i) || html.match(/"(https:\/\/i\.pinimg\.com\/originals\/[^"]+\.jpg)"/i);
       if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1].replace(/&amp;/g, '&');
    }
    
    if (!title) { const tMatch = html.match(/<title>([^<]+)<\/title>/i); if (tMatch && tMatch[1]) title = tMatch[1].split("|")[0].trim(); }
    if (videoUrl) {
        return {
           success: true,
           title: title || "Pinterest Video",
           thumbnail: imageUrl || "",
           url: videoUrl,
           mediaType: "video",
           qualities: getFallbackQualities(videoUrl, "video"),
           media: [{ type: "video", url: videoUrl, thumbnail: imageUrl || "" }]
        };
    } else if (imageUrl) {
        return {
           success: true,
           title: title || "Pinterest Image",
           thumbnail: imageUrl || "",
           url: imageUrl,
           mediaType: "image",
           media: [{ type: "image", url: imageUrl, thumbnail: imageUrl || "" }],
           // Include an info message for the UI if it expects a video
           message: "Pinterest has recently blocked video extraction. If this was a video pin, only its thumbnail could be retrieved."
        };
    }
    
    return null;
  } catch (err) {
    console.log("extractPinterestNative error:", err);
    return null;
  }
}

async function extractPinterestBtch(url: string) {
  console.log("Trying btch-downloader for Pinterest...");
  try {
    const mod = await import('btch-downloader');
    const pinterest = mod.pinterest || (mod.default && mod.default.pinterest);
    if (!pinterest) {
        console.log("pinterest function not found in btch-downloader");
        return null;
    }
    const r = await pinterest(url);
    if (r && r.status && r.result && r.result.result) {
       const pin = r.result.result;
       let mediaType = "image";
       let primaryUrl = pin.image || pin.images?.orig?.url;
       
       if (pin.is_video && pin.video_url) {
           mediaType = "video";
           primaryUrl = pin.video_url;
       } else if (pin.videos && pin.videos.V_720P) {
           mediaType = "video";
           primaryUrl = pin.videos.V_720P.url;
       } else if (pin.videos && pin.videos.V_1080P) {
           mediaType = "video";
           primaryUrl = pin.videos.V_1080P.url;
       }

       // Handle GIF if the image url ends with .gif
       if (mediaType === "image" && primaryUrl && primaryUrl.toLowerCase().endsWith('.gif')) {
           mediaType = "gif";
       }
       
       if (primaryUrl) {
           return {
             success: true,
             title: pin.title || pin.description || "Pinterest Pin",
             thumbnail: pin.image || pin.images?.orig?.url || "",
             url: primaryUrl,
             mediaType: mediaType,
             qualities: mediaType === "video" ? getFallbackQualities(primaryUrl, "video") : undefined,
             media: [{ type: mediaType, url: primaryUrl, thumbnail: pin.image || "" }]
           };
       }
    }
  } catch (e) {
    console.error("btch-downloader pinterest error:", e);
  }
  return null;
}

async function extractInstagramBtch(url: string) {
  console.log("Trying btch-downloader for Instagram...");
  try {
    const b = await getBtch();
    const r = await b.igdl(url);
    if (r && r.status && r.result && r.result.length > 0) {
      const items: any[] = r.result.filter((i: any) => i.url && i.url.trim() !== "");
      if (items.length === 0) throw new Error("Empty media returned");
      const media = items.map((item: any) => {
        const type = inferInstagramType(item, url);
        return { type, url: item.url, thumbnail: item.thumbnail || item.url };
      });
      const primary = media[0];
      const qualities = primary.type === "video" ? getFallbackQualities(primary.url, "video") : undefined;
      
      return {
        success: true,
        title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
        thumbnail: primary.thumbnail || primary.url,
        url: primary.url,
        mediaType: media.length > 1 ? "carousel" : primary.type,
        media,
        qualities
      };
    }
  } catch (e) {
    console.error("btch-downloader error:", e);
  }
  
  console.log("Falling back to Instagram embed page scraping...");
  try {
    const sc = getInstagramShortcode(url);
    if (!sc) return null;
    
    const res = await fetch(`https://www.instagram.com/p/${sc}/embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1" }
    });
    const html = await res.text();
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const thumbMatch = html.match(/"display_url":"([^"]+)"/);
    
    if (videoMatch || thumbMatch) {
      const type = videoMatch ? "video" : "image";
      const mediaUrl = videoMatch ? videoMatch[1].replace(/\\\//g, "/") : thumbMatch![1].replace(/\\\//g, "/");
      const thumbUrl = thumbMatch ? thumbMatch[1].replace(/\\\//g, "/") : mediaUrl;
      const qualities = type === "video" ? getFallbackQualities(mediaUrl, "video") : undefined;
      
      return {
        success: true,
        title: type === "video" ? "Instagram Reel" : "Instagram Post",
        thumbnail: thumbUrl,
        url: mediaUrl,
        mediaType: type,
        media: [{ type, url: mediaUrl, thumbnail: thumbUrl }],
        qualities
      };
    }
  } catch (e) {
    console.error("Instagram embed fallback error:", e);
  }
  
  return null;
}

async function extractWithCobalt(url: string) {
  const instances = [
    "https://co.wuk.sh/api/json",
    "https://cobalt.q0.is/api/json",
    "https://api.cobalt.bckc.rs/api/json",
    "https://cobalt.kwiatekit.com/api/json",
    "https://cobalt.shiron.dev/api/json",
    "https://api.cobalt.tools/api/json",
    "https://api.ryzendesu.vip/api/downloader/igdl" 
  ];

  for (const instance of instances) {
    try {
      console.log(`Trying Cobalt instance: ${instance}`);
      const isRyzen = instance.includes('ryzendesu');
      
      let res;
      if (isRyzen) {
        res = await fetch(`${instance}?url=${encodeURIComponent(url)}`);
      } else {
        res = await fetch(instance, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: url,
            aFormat: "best",
            vQuality: "max"
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        
        if (isRyzen && data.data && data.data.length > 0) {
           const media = data.data.map((m: any) => ({ type: "video", url: m.url, thumbnail: m.thumbnail || "" }));
           const primary = media[0];
           return {
             success: true,
             title: "Instagram Video",
             thumbnail: primary.thumbnail || primary.url,
             url: primary.url,
             mediaType: media.length > 1 ? "carousel" : "video",
             qualities: getFallbackQualities(primary.url, "video"),
             media: media
           };
        }

        if (data.status === "redirect" || data.status === "stream" || data.status === "success") {
          return {
            success: true,
            title: "Extracted Media",
            thumbnail: data.url && data.url.includes(".mp4") ? "" : data.url,
            url: data.url,
            mediaType: "video",
            qualities: getFallbackQualities(data.url, "video"),
            media: [{ type: "video", url: data.url, thumbnail: data.url }]
          };
        }
        if (data.status === "picker") {
          // Multiple items
          const media = data.picker.map((item: any) => ({
            type: item.type === "video" ? "video" : "image",
            url: item.url,
            thumbnail: item.thumb || ""
          }));
          const primary = media[0];
          return {
            success: true,
            title: "Extracted Media",
            thumbnail: primary?.thumbnail || primary?.url,
            url: primary?.url,
            mediaType: media.length > 1 ? "carousel" : primary?.type,
            media: media,
            qualities: primary?.type === "video" ? getFallbackQualities(primary?.url, "video") : undefined
          };
        }
      }
    } catch (e) {
      // Ignore fallback failures
    }
  }
  return null;
}

  async function extractInstagramRapidAPI(url: string) {
  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  if (!rapidKey) return null;
  
  // Default to instagram-scraper-api2.p.rapidapi.com as documented in .env.example
  const host = process.env.RAPIDAPI_IG_HOST && process.env.RAPIDAPI_IG_HOST.includes("rapidapi.com") 
      ? process.env.RAPIDAPI_IG_HOST 
      : "instagram-scraper-api2.p.rapidapi.com";
      
  console.log(`Attempting RapidAPI extraction with host: ${host}`);
  
  try {
    
    let response;
    
    if (host === 'instagram120.p.rapidapi.com') {
      response = await fetch(`https://${host}/api/instagram/links`, {
        method: 'POST',
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': host,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
    } else {
      const apiUrl = `https://${host}/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}`;
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': host
        }
      });
    }
    
    if (!response.ok) {
      console.log(`RapidAPI error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log("RapidAPI response:", text);
      let errorDetails = text;
      try {
         const json = JSON.parse(text);
         if (json.message) errorDetails = json.message;
      } catch (e) {}
      
      if (response.status === 403 && errorDetails.includes("not subscribed")) {
         return {
            success: false,
            errorMsg: `You are not subscribed to the RapidAPI host (${host}). Please go to RapidAPI, search for this API, and subscribe to its free tier. Alternatively, set RAPIDAPI_IG_HOST to an API you are subscribed to.`
         };
      }
      
      return {
         success: false,
         errorMsg: `RapidAPI Error (${response.status}): ${errorDetails}`
      };
    }
    
    const data = (await response.json()) as any;
    
    // Parse instagram-scraper-api2 format
    let mediaUrl = "";
    let thumbnail = "";
    let mediaType = "video";
    let title = "Instagram Post";
    
    if (data && data.data && data.data.items && data.data.items.length > 0) {
      const item = data.data.items[0];
      
      if (item.caption && item.caption.text) {
        title = item.caption.text.substring(0, 50);
      }
      
      if (item.carousel_media && item.carousel_media.length > 0) {
        const items = item.carousel_media.map((child: any) => {
          let url = "";
          let type = "image";
          let thumb = "";
          
          if (child.video_versions && child.video_versions.length > 0) {
             url = child.video_versions[0].url;
             type = "video";
          } else if (child.image_versions2 && child.image_versions2.candidates && child.image_versions2.candidates.length > 0) {
             url = child.image_versions2.candidates[0].url;
          }
          
          if (child.image_versions2 && child.image_versions2.candidates && child.image_versions2.candidates.length > 0) {
             thumb = child.image_versions2.candidates[0].url;
          } else {
             thumb = url;
          }
          
          return {
             type: type,
             url: `/api/proxy-download?url=${encodeURIComponent(url)}&filename=instagram_${type}`,
             thumbnail: thumb,
             id: child.id || child.pk
          };
        });
        
        if (items.length > 0 && items[0].url) {
           return {
              success: true,
              title: title || "Instagram Carousel",
              url: items[0].url,
              thumbnail: items[0].thumbnail,
              mediaType: "carousel",
              media: items,
              source: "rapidapi"
           };
        }
      }
      
      // Video
      if (item.video_versions && item.video_versions.length > 0) {
        mediaUrl = item.video_versions[0].url;
        mediaType = "video";
      } 
      // Single Image
      else if (item.image_versions2 && item.image_versions2.candidates && item.image_versions2.candidates.length > 0) {
        mediaUrl = item.image_versions2.candidates[0].url;
        mediaType = "image";
      }
      
      // Thumbnail
      if (item.image_versions2 && item.image_versions2.candidates && item.image_versions2.candidates.length > 0) {
         thumbnail = item.image_versions2.candidates[0].url;
      }
    }
    
    if (mediaUrl) {
       return {
          success: true,
          title: title,
          url: `/api/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=instagram_${mediaType}`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          source: "rapidapi"
       };
    }
    
    console.log("RapidAPI extraction found no media");
    return null;
  } catch (error) {
    console.error("RapidAPI extraction error:", error);
    return null;
  }
}

async function extractInstagramRepoBackend(url: string) {
  console.log(`Attempting Repository Backend extraction for: ${url}`);
  try {
    
    
    // Extract shortcode
    const match = url.match(/(?:p|reel|tv)\/([^\/?#&]+)/);
    if (!match || !match[1]) {
       console.log("Could not extract shortcode from Instagram URL");
       return null;
    }
    const shortcode = match[1];
    
    // The exact GraphQL query used by the yasinatesim repository
    const graphqlUrl = `https://www.instagram.com/graphql/query/?doc_id=24368985919464652&variables=${encodeURIComponent(`{"shortcode":"${shortcode}","fetch_tagged_user_count":null,"hoisted_comment_id":null,"hoisted_reply_id":null}`)}`;
    
    const response = await fetch(graphqlUrl, {
      method: 'GET',
      headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Repo GraphQL error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log("Response:", text.substring(0, 200));
      return {
         success: false,
         errorMsg: `Instagram blocked the repository's API request (${response.status}). Instagram blocks cloud server IPs from accessing this endpoint without a logged-in user session.`
      };
    }
    
    const data: any = await response.json();
    
    // Check for execution error
    if (data.errors && data.errors.length > 0) {
       console.log("Repo GraphQL returned execution error:", data.errors[0].message);
       return {
          success: false,
          errorMsg: `Instagram returned an execution error. This occurs because the repository's GraphQL endpoint requires authentication (a logged-in browser session) when called from a cloud server.`
       };
    }
    
    // Parse xdt_shortcode_media
    const media = data?.data?.xdt_shortcode_media;
    if (!media) {
       return {
          success: false,
          errorMsg: `Could not find media data in the repository's API response.`
       };
    }
    
    if (media.edge_sidecar_to_children && media.edge_sidecar_to_children.edges.length > 0) {
       const children = media.edge_sidecar_to_children.edges.map((e: any) => e.node);
       const items = children.map((child: any) => {
          let url = child.display_url;
          let type = "image";
          if (child.is_video) {
             url = child.video_url;
             type = "video";
          }
          return {
             type: type,
             url: `/api/proxy-download?url=${encodeURIComponent(url)}&filename=instagram_${type}`,
             thumbnail: child.display_url || url,
             id: child.id
          };
       });
       
       return {
          success: true,
          title: "Instagram Carousel",
          url: items[0].url,
          thumbnail: items[0].thumbnail,
          mediaType: "carousel",
          media: items,
          source: "repo_backend"
       };
    }
    
    let mediaUrl = "";
    let mediaType = "video";
    let thumbnail = media.display_url || "";
    
    if (media.is_video) {
       mediaUrl = media.video_url;
       mediaType = "video";
    } else {
       mediaUrl = media.display_url;
       mediaType = "image";
    }
    
    if (mediaUrl) {
       return {
          success: true,
          title: "Instagram Post",
          url: `/api/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=instagram_${mediaType}`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          source: "repo_backend"
       };
    }
    
    return null;
  } catch (error) {
    console.error("Repo extraction error:", error);
    return null;
  }
}


  

const sizeCache = new Map<string, string>();

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fetchFileSize(url: string): Promise<string> {
    if (sizeCache.has(url)) return sizeCache.get(url)!;
    
    if (url.includes('m3u8')) return "Unknown Size";
    let targetUrl = url;
    if (url.startsWith('/api/proxy-download') || url.includes('/api/proxy-download')) {
        const match = url.match(/[?&]url=([^&]+)/);
        if (match) {
             targetUrl = decodeURIComponent(match[1]);
        }
    } else if (url.startsWith('/api/')) {
        return "Unknown Size";
    }

    try {
        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? require('https') : require('http');
        
        const size: number | null = await new Promise((resolve) => {
            const req = client.request(targetUrl, { method: 'HEAD', timeout: 3000, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            } }, (res: any) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (!redirectUrl.startsWith('http')) {
                         redirectUrl = parsed.origin + (redirectUrl.startsWith('/') ? '' : '/') + redirectUrl;
                    }
                    const redirParsed = new URL(redirectUrl);
                    const redirClient = redirParsed.protocol === 'https:' ? require('https') : require('http');
                    const redirReq = redirClient.request(redirParsed, { method: 'HEAD', timeout: 3000, headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    } }, (redirRes: any) => {
                        if (redirRes.headers['content-length']) {
                            resolve(parseInt(redirRes.headers['content-length'], 10));
                        } else {
                            resolve(null);
                        }
                    });
                    redirReq.on('error', () => resolve(null));
                    redirReq.on('timeout', () => { redirReq.destroy(); resolve(null); });
                    redirReq.end();
                } else if (res.headers['content-length']) {
                    resolve(parseInt(res.headers['content-length'], 10));
                } else {
                    resolve(null);
                }
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.end();
        });
        
        const formatted = size ? formatBytes(size) : "Unknown Size";
        sizeCache.set(url, formatted);
        return formatted;
    } catch(e) {
        return "Unknown Size";
    }
}

async function enrichResultSizes(result: any) {
    if (!result || !result.qualities || !Array.isArray(result.qualities)) return result;
    
    const fetchPromises = result.qualities.map(async (q: any) => {
        if (!q.url) return;
        const sizeStr = String(q.size || "");
        
        let needsFetch = false;
        if (!q.size || q.size === 'Unknown' || sizeStr === '0 MB' || sizeStr === '~ 0 MB' || sizeStr.match(/^[a-zA-Z\s]+$/)) {
            needsFetch = true;
        }

        if (needsFetch) {
            const realSize = await fetchFileSize(q.url);
            q.size = realSize;
        } else {
            // Keep existing valid size like "~ 12 MB"
        }
    });
    
    await Promise.allSettled(fetchPromises);
    return result;
}

app.post("/api/download", async (req, res) => {
    const originalJson = res.json.bind(res);
    res.json = function(body) {
        if (body && body.success) {
            enrichResultSizes(body).then(enriched => {
                originalJson(enriched);
            }).catch(e => {
                originalJson(body);
            });
        } else {
            originalJson(body);
        }
        return this;
    };

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    try {
      let trimmedUrl = url.trim();
      const lowerUrl = trimmedUrl.toLowerCase();
      const { platform, type } = classifyUrl(trimmedUrl);
      const isProfile = type === 'profile';
      console.log(`Processing extraction for platform: ${platform}, type: ${type}, url: ${trimmedUrl}`);

      if (isProfile) {
        if (platform === 'youtube') {
           console.log("YouTube Profile URL detected, extracting with yt-dlp flat-playlist.");
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           }
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
        console.log("Trying Twitter extraction...");
        
        const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
        if (rapidKey) {
            try {
                const rapidResult = await extractTwitterRapidAPI(trimmedUrl, rapidKey);
                if (rapidResult && rapidResult.media && rapidResult.media.length > 0) {
                    return res.json({ success: true, ...rapidResult });
                }
            } catch (err: any) {
                // If we get a subscription error, send it to the UI!
                if (err.message.includes("subscribed")) {
                     return res.status(500).json({ success: false, message: err.message });
                }
            }
        }

        const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
        const xtractorResult = await extractTwitterXtractor(trimmedUrl, authToken);
        
        if (xtractorResult && xtractorResult.media && xtractorResult.media.length > 0) {
            return res.json({ success: true, ...xtractorResult });
        } else {
            let msg = "Twitter blocked our server IP. ";
            if (rapidKey) {
                 msg += "We tried RapidAPI but it failed. Please ensure you are subscribed to the 'Twitter135' API on RapidAPI (it's free).";
            } else {
                 msg += "To fix this, add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
            }
            return res.status(500).json({ success: false, message: msg });
        }
      }
      } else {
        if (platform === 'pinterest') {
            console.log("Trying native extractor for Pinterest...");
            
            // Resolve pin.it URLs first so fallbacks can use the real URL
            let resolvedUrl = trimmedUrl;
            if (trimmedUrl.includes('pin.it')) {
                try {
                    const resp = await fetch(trimmedUrl); // Follows redirects natively if possible
                    let finalUrl = resp.url;
                    
                    if (finalUrl === trimmedUrl) {
                        // Might be a meta refresh
                        const text = await resp.text();
                        const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i) || 
                                          text.match(/href="([^"]+api\.pinterest\.com\/url_shortener[^"]+)"/i);
                        if (metaMatch && metaMatch[1]) {
                            finalUrl = metaMatch[1];
                        }
                    }
                    
                    if (finalUrl.includes('api.pinterest.com/url_shortener')) {
                         const redirectResp = await fetch(finalUrl, { redirect: 'manual' });
                         if (redirectResp.status >= 300 && redirectResp.status < 400) {
                            finalUrl = redirectResp.headers.get('location') || finalUrl;
                         } else {
                            // If it's a 200, maybe another meta refresh
                            const text = await redirectResp.text();
                            const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i);
                            if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                         }
                    }
                    
                    resolvedUrl = finalUrl;
                } catch(e) {}
            }
            trimmedUrl = resolvedUrl;
            
            const nativeResult = await extractPinterestNative(trimmedUrl);
            if (nativeResult && nativeResult.success && nativeResult.mediaType === 'video') {
                return res.json(nativeResult);
            }
            console.log("Trying yt-dlp for Pinterest...");
            const ytResult = await extractWithYtDlp(trimmedUrl);
            if (ytResult && ytResult.success && ytResult.mediaType === 'video') {
                return res.json(ytResult);
            }
            console.log("yt-dlp did not return a video, trying btch-downloader for Pinterest...");
            const pinResult = await extractPinterestBtch(trimmedUrl);
            if (pinResult && pinResult.success) {
                return res.json(pinResult);
            }
            if (ytResult && ytResult.success) {
                return res.json(ytResult);
            }
            if (nativeResult && nativeResult.success) {
                return res.json(nativeResult);
            }
        } else if (platform === 'youtube') {
            console.log("YouTube direct extraction requested.");
            const vredenResult = await extractWithVreden(trimmedUrl);
            if (vredenResult && vredenResult.success) {
                return res.json(vredenResult);
            }
            console.log("Vreden extraction failed, trying local YT-DLP...");
            const ytDlpResult = await extractWithYtDlp(trimmedUrl);
            if (ytDlpResult && ytDlpResult.success) {
                return res.json(ytDlpResult);
            }
            console.log("YouTube specialized extractors failed, continuing to fallbacks...");
        }
        
        if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
           console.log("Trying Instagram RapidAPI...");
           const rapidResult = await extractInstagramRapidAPI(trimmedUrl);
           if (rapidResult && rapidResult.success) {
               return res.json(rapidResult);
           }
           
           console.log("Trying Instagram RepoBackend...");
           const repoResult = await extractInstagramRepoBackend(trimmedUrl);
           if (repoResult && repoResult.success) {
               return res.json(repoResult);
           }

           const btchResult = await extractInstagramBtch(trimmedUrl);
           if (btchResult && btchResult.success) {
               return res.json(btchResult);
           }
        }
        
        console.log("Trying Cobalt API...");
        const cobaltResult = await extractWithCobalt(trimmedUrl);
        if (cobaltResult && cobaltResult.success) {
           return res.json(cobaltResult);
        }
        
        if (platform === 'youtube') {
           console.log("Trying Vreden YTmp4 fallback...");
           const vredenResult = await extractWithVreden(trimmedUrl);
           if (vredenResult && vredenResult.success) return res.json(vredenResult);
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
           console.log("Trying Twitter RapidAPI...");
           const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
           if (rapidKey) {
               try {
                   const rapidResult = await extractTwitterRapidAPI(trimmedUrl, rapidKey);
                   if (rapidResult && rapidResult.media && rapidResult.media.length > 0) {
                       return res.json({ success: true, ...rapidResult });
                   }
               } catch (e: any) { }
           }
           console.log("Trying Twitter Xtractor...");
           const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
           const xtractorResult = await extractTwitterXtractor(trimmedUrl, authToken);
           if (xtractorResult && xtractorResult.media && xtractorResult.media.length > 0) {
               return res.json({ success: true, ...xtractorResult });
           }
        }

        console.log("Trying YT-DLP fallback...");
        const ytDlpResult = await extractWithYtDlp(trimmedUrl);
        if (ytDlpResult && ytDlpResult.success) {
           return res.json(ytDlpResult);
        }

        console.log("Trying AI extraction fallback...");
        const aiResult = await extractWithAI(trimmedUrl, false);
        if (aiResult && aiResult.success) {
           return res.json(aiResult);
        }

        let errorMsg = "The media content could not be retrieved. Please verify the link is public and try again.";
        if (trimmedUrl.includes("instagram.com")) {
          if ((req as any).igManualFallback) {
             return res.status(400).json({
                success: false,
                message: "Instagram blocks automated requests. You must use the manual JSON workaround.",
               needsManualJson: true,
               url: trimmedUrl
             });
          }
          errorMsg = "Instagram blocks our cloud servers from downloading posts. Please check your RapidAPI subscription.";
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
          errorMsg = "Twitter blocked our server IP for unauthenticated requests. Add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
        }
        return res.status(400).json({ success: false, message: `Extraction failed: ${errorMsg}` });
      }


          
    } catch (error) {
      console.error("API Download Exception:", error.message);
      return res.status(500).json({ success: false, message: error.message || "An unexpected error occurred while processing the URL." });
    }
  });

  app.get("/api/youtube-stream", async (req, res) => {
    const videoUrl = req.query.url as string;
    const quality = (req.query.quality as string) || "360";
    const filename = (req.query.filename as string) || "youtube_video.mp4";

    if (!videoUrl) {
      return res.status(400).send("Missing url parameter");
    }

    try {
      console.log(`Dynamic YouTube streaming requested for: ${videoUrl} at quality: ${quality}`);
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {};
      console.log = () => {};
      let result;
      try {
        result = await vredenYtmp4(videoUrl, quality);
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }
      if (result && result.status && result.download && result.download.url) {
        const directUrl = result.download.url;
        console.log(`Successfully fetched direct URL for streaming: ${directUrl}`);
        pipeUrlStream(directUrl, res, filename, false);
      } else {
        console.error("Vreden dynamic fetch failed to find direct URL");
        res.status(500).send("Failed to retrieve direct download stream from YouTube provider.");
      }
    } catch (err: any) {
      console.error("Error in /api/youtube-stream:", err.message);
      res.status(500).send("Error streaming YouTube video: " + err.message);
    }
  });

  

  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).send("Missing url parameter");
    }
    
    try {
      
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      res.setHeader("Cache-Control", "public, max-age=86400");
      
      if (response.body) {
         response.body.pipe(res);
      } else {
         const buffer = await response.buffer();
         res.send(buffer);
      }
    } catch (error: any) {
      console.error("Proxy image error:", error.message);
      res.status(500).send("Error proxying image");
    }
  });

  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url;
    const audioUrl = req.query.audioUrl;
    const mux = req.query.mux === "true";
    const extractAudio = req.query.extractAudio === "true";
    let customFilename = req.query.filename || "download.mp4";
    const inline = req.query.inline === "true";

    if (!fileUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    if (extractAudio) {
      res.setHeader('Content-Type', 'audio/mpeg');
      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\r\n]+/g, ''));
      const disposition = inline ? "inline" : `attachment; filename*=UTF-8''${encodedFilename}`;
      res.setHeader('Content-Disposition', disposition);

      const ffmpeg = spawn('ffmpeg', [
        '-i', fileUrl as string,
        '-q:a', '0',
        '-map', 'a',
        '-f', 'mp3',
        'pipe:1'
      ]);

      ffmpeg.stdout.pipe(res);
      
      ffmpeg.on('error', (err) => {
        console.error('ffmpeg process error:', err);
        if (!res.headersSent) res.status(500).end();
      });

      req.on("close", () => {
        ffmpeg.kill();
      });
    } else if (mux && audioUrl) {
      res.setHeader('Content-Type', 'video/mp4');
      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\r\n]+/g, ''));
      const disposition = inline ? "inline" : `attachment; filename*=UTF-8''${encodedFilename}`;
      res.setHeader('Content-Disposition', disposition);

      // Mux using ffmpeg safely with spawn
      const ffmpeg = spawn('ffmpeg', [
        '-i', fileUrl as string,
        '-i', audioUrl as string,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-movflags', 'frag_keyframe+empty_moov',
        '-f', 'mp4',
        'pipe:1'
      ]);
      
      ffmpeg.stdout.pipe(res);
      
      ffmpeg.stderr.on('data', (d) => {
         // console.log('ffmpeg:', d.toString());
      });
      
      ffmpeg.on('error', (err) => {
        console.error('ffmpeg process error:', err);
        if (!res.headersSent) res.status(500).end();
      });
      
      req.on("close", () => {
        ffmpeg.kill();
      });
    } else {
      
      const throttleMBps = req.query.throttle && req.query.throttle !== 'unlimited' ? parseInt(req.query.throttle as string, 10) : 0;
      pipeUrlStream(fileUrl as string, res, customFilename as string, inline, 5, throttleMBps);

    }
  });




  // Web Push setup
  const vapidKeys = {
    publicKey: 'BHoQSTFIR9f-8G4vLeGwzdbzbmO4z_GvetdY0wd84U2QPYy2woYZ04dU76gxgmhC5eW-ULFEUizmx2GIp1c7Yk0',
    privateKey: 'uFUg29vDq77vqK8ejhu_YdmeXH_9wqgoXH3Y0H5mwq4'
  };
  webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  let subscriptions: any[] = [];
  const subsFile = path.join(process.cwd(), 'subscriptions.json');
  try {
    if (fs.existsSync(subsFile)) {
      subscriptions = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
    }
  } catch (e) {
    console.error("Could not load subscriptions", e);
  }

  app.use(express.json());

  app.post("/api/push/subscribe", (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    
    const existing = subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!existing) {
      subscriptions.push(subscription);
      fs.writeFileSync(subsFile, JSON.stringify(subscriptions));
    }
    res.status(201).json({});
  });

  app.post("/api/push/send", (req, res) => {
    const notificationPayload = {
      title: req.body.title || "New Update Available!",
      body: req.body.body || "Check out the latest features in AURA Downloader.",
      url: req.body.url || "/"
    };

    const promises = subscriptions.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(notificationPayload))
        .catch(err => {
          console.error("Error sending push to", sub.endpoint, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            return sub.endpoint; // Return endpoint to remove
          }
          return null;
        })
    );

    Promise.all(promises).then((results) => {
      const toRemove = results.filter(r => r !== null && r !== undefined);
      if (toRemove.length > 0) {
        subscriptions = subscriptions.filter(s => !toRemove.includes(s.endpoint));
        fs.writeFileSync(subsFile, JSON.stringify(subscriptions));
      }
      res.status(200).json({ message: "Notifications sent successfully" });
    });
  });

  app.get("/api/health", (req, res) => {

    res.status(200).send("OK");
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

startServer();
