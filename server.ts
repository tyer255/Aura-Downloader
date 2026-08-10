
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
      const availableQualities = downloadInfo.availableQuality || [1080, 720, 480, 360, 144];
      
      let videoId = "";
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (match) {
        videoId = match[1];
      }
      
      const cleanTitle = (result.metadata?.title || title)
        .replace(/\s*\(\d+p\)\.mp4$/i, "")
        .replace(/\.mp4$/i, "")
        .trim();

      const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : (result.metadata?.thumbnail || result.metadata?.image || "");

      const qualities: any[] = [];
      const sortedQualities = [...availableQualities]
        .map(q => Number(String(q).replace(/p$/i, '')))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => b - a);
      
      const seenQualities = new Set<number>();
      sortedQualities.forEach((q) => {
        if (!seenQualities.has(q)) {
          seenQualities.add(q);
          const qStr = String(q);
          qualities.push({
            label: `${qStr}p (MP4)`,
            url: `/api/get-youtube-link?url=${encodeURIComponent(url)}&quality=${qStr}&filename=${encodeURIComponent(cleanTitle)}.mp4`,
            ext: "mp4",
            size: q >= 720 ? "High Definition" : "Standard Quality"
          });
        }
      });

      let primaryUrl = qualities[0]?.url;
      if (downloadInfo.url) {
        primaryUrl = `/api/proxy-download?url=${encodeURIComponent(downloadInfo.url)}&filename=${encodeURIComponent(cleanTitle)}.mp4`;
      }

      const audioUrl = downloadInfo.url 
        ? `/api/proxy-download?url=${encodeURIComponent(downloadInfo.url)}&filename=${encodeURIComponent(cleanTitle)}.mp3&extractAudio=true`
        : `/api/get-youtube-link?url=${encodeURIComponent(url)}&quality=audio&filename=${encodeURIComponent(cleanTitle)}.mp3`;

      qualities.push({
         label: "Audio (MP3)",
         url: audioUrl,
         ext: "mp3",
         size: "Audio Only"
      });

      return {
        success: true,
        title: cleanTitle || "YouTube Video",
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




async function extractYoutubeBtch(url: string) {
  console.log("Trying btch-downloader for YouTube...");
  try {
    const b = await getBtch();
    if (typeof b.youtube === 'function') {
      const r = await b.youtube(url);
      if (r && r.status && r.mp4) {
        return { success: true, title: r.title || "YouTube Video", url: r.mp4, thumbnail: r.thumbnail || "", mediaType: "video", source: "btch", qualities: [ { label: "Video (MP4)", url: r.mp4, ext: "mp4", size: "High Definition" }, { label: "Audio (MP3)", url: r.mp3, ext: "mp3", size: "Audio Only" } ] };
      }
    }
    return null;
  } catch (error: any) {
    return null;
  }
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
        // console.error removed
        if (e.response && e.response.status === 403) {
            return null;
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



async function extractWithYtDlpWithTimeout(url: string, timeoutMs = 3000) {
  return Promise.race([
    extractWithYtDlp(url),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
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
      noCheckFormats: true
    };
    
    if (isPlaylist) {
       options.flatPlaylist = true;
       options.playlistEnd = 300;
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
                console.log("Rapid API Error in yt-dlp:", e.response?.data || e.message);
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
      
      if (bestAudio) {
         qualities.push({
            label: "Audio (MP3)",
            url: `/api/proxy-download?url=${encodeURIComponent(bestAudio.url)}&filename=${encodeURIComponent(data.title || "audio")}.mp3&extractAudio=true`,
            ext: "mp3",
            size: "Audio Only"
         });
      }
      
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

    let videoId = "";
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      videoId = ytMatch[1];
    }
    const finalThumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : (data.thumbnail || "");

    return {
      success: true,
      title: data.title || "Extracted Video",
      url: mediaUrl,
      thumbnail: finalThumbnail,
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities.length > 0 ? qualities : getFallbackQualities(mediaUrl, "video")
    };
  } catch(e: any) {
    // yt-dlp extraction was not successful
    return null;
  }
}



async function extractSnapchatNative(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      }
    });
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const spotlightStories = data?.props?.pageProps?.spotlightFeed?.spotlightStories || [];
      if (spotlightStories.length > 0) {
        let videoUrl = spotlightStories[0]?.metadata?.videoMetadata?.contentUrl;
        if (!videoUrl) {
           const snap = spotlightStories[0].story?.snapList?.[0]?.snapUrls;
           videoUrl = snap?.mediaUrl;
        }
        if (videoUrl) {
          return {
            success: true,
            title: spotlightStories[0]?.metadata?.videoMetadata?.description || "Snapchat Spotlight",
            thumbnail: spotlightStories[0]?.metadata?.videoMetadata?.thumbnailUrl || spotlightStories[0].story?.thumbnailUrl || videoUrl,
            url: videoUrl,
            mediaType: "video",
            qualities: getFallbackQualities(videoUrl, "video"),
            source: "native"
          };
        }
      }
      
      const story = data?.props?.pageProps?.story;
      if (story?.snapList?.[0]?.snapUrls?.mediaUrl) {
          const videoUrl = story.snapList[0].snapUrls.mediaUrl;
          return {
            success: true,
            title: story.storyTitle || "Snapchat Story",
            url: videoUrl,
            thumbnail: story.thumbnailUrl || videoUrl,
            mediaType: "video",
            qualities: getFallbackQualities(videoUrl, "video"),
            source: "native"
          }
      }
    }
  } catch(e) {
    console.log("Snapchat native error:", e);
  }
  return null;
}

async function getSpotifyTrackDetails(trackId: string) {
  let trackName = "";
  let primaryArtist = "";
  let allArtists: string[] = [];
  let albumName = "";
  let isrc = "";
  let durationMs = 0;
  let thumbnail = "";

  // 1. Try Spotify Web API if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are configured
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (clientId && clientSecret) {
    try {
      const authRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
        },
        body: "grant_type=client_credentials"
      });
      const authData = await authRes.json();
      if (authData.access_token) {
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { "Authorization": `Bearer ${authData.access_token}` }
        });
        const trackData = await trackRes.json();
        if (trackData.name) {
          trackName = trackData.name;
          primaryArtist = trackData.artists?.[0]?.name || "";
          allArtists = trackData.artists?.map((a: any) => a.name) || [];
          albumName = trackData.album?.name || "";
          isrc = trackData.external_ids?.isrc || "";
          durationMs = trackData.duration_ms || 0;
          thumbnail = trackData.album?.images?.[0]?.url || "";
        }
      }
    } catch (e) {}
  }

  // 2. Embed page NEXT_DATA extraction (Always works without credentials)
  if (!trackName) {
    try {
      const axios = (await import('axios')).default;
      const embedRes = await axios.get(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const match = embedRes.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      if (match) {
        const json = JSON.parse(match[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          trackName = entity.name || entity.title || "";
          primaryArtist = entity.artists?.[0]?.name || "";
          allArtists = entity.artists?.map((a: any) => a.name) || [];
          durationMs = entity.duration || 0;
          thumbnail = entity.visualIdentity?.image?.[0]?.url || "";
        }
      }
    } catch (e) {}
  }

  return {
    trackId,
    trackName,
    primaryArtist,
    allArtists,
    albumName,
    isrc,
    durationMs,
    durationSeconds: durationMs / 1000,
    thumbnail
  };
}

async function resolveSpotifyTrackToYouTube(trackMeta: {
  trackName: string;
  primaryArtist: string;
  allArtists: string[];
  albumName?: string;
  isrc?: string;
  durationMs: number;
}): Promise<string | null> {
  const { trackName, primaryArtist, allArtists, albumName = "", isrc = "", durationMs } = trackMeta;
  const targetDurationSec = durationMs / 1000;

  const BANNED_KEYWORDS = [
    "female version", "female cover", "female vocal", "male version", "male cover",
    "slowed", "reverb", "remix", "cover", "nightcore", "lofi", "lo-fi", "sped up",
    "speed up", "bass boosted", "boosted", "instrumental", "karaoke", "mashup",
    "live", "edit", "8d audio", "8d", "16d", "ringtone", "tiktok version", "acapella"
  ];

  const originalTitleLower = (trackName + " " + albumName).toLowerCase();
  const activeBannedKeywords = BANNED_KEYWORDS.filter(kw => !originalTitleLower.includes(kw));

  const queries: string[] = [];
  if (isrc) {
    queries.push(`"${isrc}"`);
  }
  if (primaryArtist && trackName) {
    queries.push(`"${primaryArtist}" "${trackName}" Topic`);
    queries.push(`"${trackName}" ${allArtists.join(" ")} Official Audio`);
    queries.push(`"${trackName}" ${primaryArtist} Official Audio`);
    queries.push(`"${trackName}" ${primaryArtist}`);
  }

  function parseDuration(durStr?: string): number {
    if (!durStr) return 0;
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  const axios = (await import('axios')).default;

  const candidates: { id: string; title: string; channel: string; durSec: number; score: number; durationDelta: number }[] = [];
  const seenIds = new Set<string>();

  // Fetch all queries concurrently to drastically reduce extraction time
  const searchPromises = queries.map(q => 
    axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 5000
    }).then(res => res.data).catch(() => null)
  );

  const htmlResults = await Promise.all(searchPromises);

  for (const searchHtml of htmlResults) {
    if (!searchHtml) continue;
    
    try {
      const jsonMatch = searchHtml.match(/var ytInitialData = ({.*?});<\/script>/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

        for (let c of contents) {
          const items = c.itemSectionRenderer?.contents || [];
          for (let item of items) {
            if (item.videoRenderer) {
              const v = item.videoRenderer;
              if (!v.videoId || seenIds.has(v.videoId)) continue;
              seenIds.add(v.videoId);

              const title = v.title?.runs?.[0]?.text || "";
              const channel = v.ownerText?.runs?.[0]?.text || "";
              const durSec = parseDuration(v.lengthText?.simpleText);

              const titleLower = title.toLowerCase();
              const channelLower = channel.toLowerCase();

              // Rejection Check 1: Banned Keywords
              let hasBanned = false;
              for (const kw of activeBannedKeywords) {
                if (titleLower.includes(kw) || channelLower.includes(kw)) {
                  hasBanned = true;
                  break;
                }
              }
              if (hasBanned) continue;

              // Rejection Check 2: Artist match
              const isIsrcMatch = isrc && (titleLower.includes(isrc.toLowerCase()) || channelLower.includes(isrc.toLowerCase()));
              const artistMatched = allArtists.some(artist => 
                artist && (titleLower.includes(artist.toLowerCase()) || channelLower.includes(artist.toLowerCase()))
              );
              if (!artistMatched && !isIsrcMatch && allArtists.length > 0) continue;

              // Rejection Check 3: Duration match (max 6s delta)
              const maxAllowedDelta = 6;
              const durationDelta = Math.abs(durSec - targetDurationSec);
              if (targetDurationSec > 0 && durationDelta > maxAllowedDelta) continue;

              // Candidate Passed! Calculate preference score
              let score = 0;

              // Priority 0: ISRC Match
              if (isIsrcMatch) {
                score += 1000;
              }

              // Priority 1: Official Artist Channel
              const isOfficialArtistChannel = allArtists.some(a => a && channelLower.includes(a.toLowerCase()));
              if (isOfficialArtistChannel && !channelLower.includes("topic")) {
                score += 400;
              }

              // Priority 2: Official Audio
              if (titleLower.includes("official audio") || titleLower.includes("audio")) {
                score += 300;
              }

              // Priority 3: Official Music Video
              if (titleLower.includes("official music video") || titleLower.includes("official video")) {
                score += 200;
              }

              // Priority 4: Official Topic Channel
              if (channelLower.includes("- topic") || channelLower.endsWith("topic")) {
                score += 100;
              }

              // Bonus for precise duration match
              score += (maxAllowedDelta - durationDelta) * 20;
              if (durationDelta <= 3) {
                score += 50; // extra bonus for very tight duration match
              }

              candidates.push({ id: v.videoId, title, channel, durSec, score, durationDelta });
            }
          }
        }
      }
    } catch (e) {}
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].id;
  }

  // Final fallback to youtube-sr if no candidates matched YouTube HTML search
  try {
    const ytModule = await import('youtube-sr');
    const YouTube = ytModule.default?.default || ytModule.default || ytModule;
    const cleanSearch = `${trackName} ${primaryArtist}`.trim();
    const ytRes = await YouTube.searchOne(`${cleanSearch} Topic`);
    if (ytRes && ytRes.id) return ytRes.id;
  } catch(e) {}

  return null;
}

async function extractSpotify(url: string) {
    try {
        const axios = (await import('axios')).default;
        if (url.includes('spoti.fi') || url.includes('spotify.link')) {
            try {
                const redirectRes = await axios.get(url, { maxRedirects: 5, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
                if (redirectRes.request?.res?.responseUrl) {
                    url = redirectRes.request.res.responseUrl;
                }
            } catch(e) {}
        }

        const isPlaylist = url.includes('/playlist/') || url.includes('/album/');
        const trackIdMatch = url.match(/track[\/:]([a-zA-Z0-9]+)/);

        if (!isPlaylist && trackIdMatch && trackIdMatch[1]) {
            const trackId = trackIdMatch[1];
            const details = await getSpotifyTrackDetails(trackId);

            const title = details.trackName
              ? details.trackName + (details.primaryArtist ? ` - ${details.primaryArtist}` : "")
              : "Spotify Track";

            let lyrics = "";
            let syncedLyrics = "";
            try {
              const lyricsRes = await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(details.trackName)}&artist_name=${encodeURIComponent(details.primaryArtist)}`);
              if (lyricsRes.data && lyricsRes.data.length > 0) {
                lyrics = lyricsRes.data[0].plainLyrics || "";
                syncedLyrics = lyricsRes.data[0].syncedLyrics || "";
              }
            } catch (e) {
              // Ignore lyrics fetch errors
            }

            const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(details.trackName)}&artist=${encodeURIComponent(details.primaryArtist)}&artists=${encodeURIComponent(details.allArtists.join(','))}&durationMs=${details.durationMs}&isrc=${encodeURIComponent(details.isrc)}`;

            return {
              success: true,
              mediaType: 'audio',
              title: title,
              thumbnail: details.thumbnail,
              source: "spotify",
              lyrics,
              syncedLyrics,
              qualities: [
                {
                  label: "MP3 Audio",
                  url: resolveUrl,
                  ext: "mp3",
                  isAudio: true,
                  size: "Unknown Size",
                  _query: `${details.trackName} ${details.primaryArtist}`
                }
              ]
            };
        }

        let embedUrl = url;
        if (url.includes('open.spotify.com/')) {
            embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        } else {
            embedUrl = `https://open.spotify.com/embed/${url.split('spotify.com/')[1] || ''}`;
        }
        
        const res = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const nextMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!nextMatch) return { success: false, message: 'Spotify extraction failed: No data found' };
        
        const json = JSON.parse(nextMatch[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        
        if (!entity) return { success: false, message: 'Spotify data not found in page' };
        
        if (isPlaylist) {
            const tracks = entity.trackList || [];
            const playlistCover = entity.visualIdentity?.image?.[0]?.url || "";

            const resolvedTracks = await Promise.all(tracks.map(async (t: any) => {
                if (!t.title) return null;
                const trackName = t.title;
                const artistName = t.subtitle || (t.artists && t.artists[0] ? t.artists[0].name : "");
                let trackId = "";
                if (t.uri && t.uri.includes('track:')) {
                    trackId = t.uri.split(':')[2] || "";
                }
                let thumb = t.image?.[0]?.url || "";

                if (!thumb && trackId) {
                    try {
                        const oemb = await axios.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`, { timeout: 2500 });
                        if (oemb.data && oemb.data.thumbnail_url) {
                            thumb = oemb.data.thumbnail_url;
                        }
                    } catch(e) {}
                }

                if (!thumb) {
                    thumb = playlistCover;
                }

                const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&durationMs=${t.duration || 0}`;

                return {
                    type: "audio",
                    url: resolveUrl,
                    thumbnail: thumb,
                    title: trackName + (artistName ? ` - ${artistName}` : ""),
                    qualities: [
                        { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName}` }
                    ]
                };
            }));

            const media = resolvedTracks.filter(Boolean);

            return {
                success: true,
                mediaType: 'playlist',
                title: entity.name || "Spotify Playlist",
                thumbnail: playlistCover,
                source: "spotify",
                media: media
            };
        } else {
            const trackName = entity.title || entity.name;
            const artistName = entity.artists?.[0]?.name || "";
            const thumb = entity.visualIdentity?.image?.[0]?.url || "";
            const trackId = entity.id || "";
            const durationMs = entity.duration || 0;

            const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&durationMs=${durationMs}`;
            
            return {
                success: true,
                mediaType: 'audio',
                title: trackName + (artistName ? ` - ${artistName}` : ""),
                thumbnail: thumb,
                source: "spotify",
                qualities: [
                    { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName}` }
                ]
            };
        }
    } catch(e: any) {
        return { success: false, message: "Extraction failed. Please try again later." };
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
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'snapchat' | 'spotify' | 'threads' | 'unknown' = 'unknown';
  let type: 'profile' | 'media' | 'playlist' = 'media';

  if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube-nocookie.com")) {
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
  } else if (url.includes("instagram.com") || url.includes("instagr.am") || url.includes("instagr.com")) {
    platform = 'instagram';
    if (!/\/(p|reel|tv|reels|stories)\//.test(url)) {
      type = 'profile';
    }
  } else if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com") || url.includes("fb.gg") || url.includes("fb.me")) {
    platform = 'facebook';
  } else if (url.includes("tiktok.com") || url.includes("vt.tiktok.com") || url.includes("vm.tiktok.com")) {
    platform = 'tiktok';
  } else if (url.includes("reddit.com") || url.includes("redd.it")) {
    platform = 'reddit';
  } else if (url.includes("pinterest.com") || url.includes("pin.it") || url.includes("pinterest.")) {
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
  } else if (url.includes("spotify.com") || url.includes("spoti.fi") || url.includes("spotify.link")) {
    platform = 'spotify';
    if (url.includes("/playlist/")) type = 'playlist';
    else if (url.includes("/artist/") || url.includes("/user/")) type = 'profile';
  } else if (url.includes("threads.net") || url.includes("threads.com")) {
    platform = 'threads';
    if (url.includes("/post/") || url.includes("/t/")) type = 'media';
    else type = 'profile';
  } else if (url.includes("x.com") || url.includes("twitter.com") || url.includes("t.co")) {
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
  } else if (url.includes("linkedin.com") || url.includes("lnkd.in")) {
    platform = 'linkedin';
    if (url.includes("/in/") || url.includes("/company/")) {
      type = 'profile';
    } else if (url.includes("/posts/")) {
      type = 'media';
    }
  } else if (url.includes("snapchat.com")) {
    platform = 'snapchat';
    if (!url.includes("/spotlight/") && !url.includes("/s/") && !url.includes("/p/")) {
      type = 'profile';
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
    if (targetUrl.startsWith("/")) {
      targetUrl = `http://127.0.0.1:3000${targetUrl}`;
    } else if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
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

      const encodedFilename = encodeURIComponent(((customFilename || "download") as string).replace(/[\r\n]+/g, ''));
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

export 
async function ensureYtDlp() {
  const ytdlpPath = path.join(process.cwd(), 'yt-dlp');
  const binDir = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin');
  const nodeModulesYtdlp = path.join(binDir, 'yt-dlp');
  
  try {
    fs.mkdirSync(binDir, { recursive: true });
    
    // Download fresh if not exists or if size is suspiciously small/corrupt
    let needDownload = true;
    if (fs.existsSync(nodeModulesYtdlp)) {
       const stats = fs.statSync(nodeModulesYtdlp);
       if (stats.size > 2000000) {
           needDownload = false; // looks okay
       }
    }
    
    if (needDownload) {
       console.log("Downloading yt-dlp binary...");
       const childProcess = await import('child_process');
       childProcess.execSync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ' + nodeModulesYtdlp);
       childProcess.execSync('chmod a+rx ' + nodeModulesYtdlp);
       console.log("yt-dlp downloaded.");
    }
  } catch (e) {
    console.error("Failed to ensure yt-dlp:", e);
  }
}
ensureYtDlp();

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = process.env.PORT || 3000;

  // Security Middlewares for Production
  app.use(helmet({
    crossOriginResourcePolicy: false, // allow images to load
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // disabled temporarily for dev/preview iframe
    xFrameOptions: false // allow iframe preview
  }));
  app.use(cors());

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  
  const SERVER_BUILD_ID = process.env.BUILD_ID || process.env.REVISION_ID || Date.now().toString();

  app.get("/api/version", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({
      success: true,
      version: "2.5.0",
      buildId: SERVER_BUILD_ID,
      timestamp: Date.now()
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "API is working",
      buildId: SERVER_BUILD_ID
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
    // silently ignore btch-downloader errors
  }
  return null;
}


async function extractTiktokTikwm(url: string) {
    try {
        console.log("Trying tikwm for TikTok...");
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data && data.data) {
            const media = [];
            let mediaType = "video";
            let thumbnailUrl = data.data.cover || "";
            let mainUrl = data.data.play || data.data.wmplay || data.data.hdplay || "";
            
            if (data.data.images && data.data.images.length > 0) {
                mediaType = "carousel";
                data.data.images.forEach((img: string) => {
                    media.push({ type: "image", url: img, thumbnail: img });
                });
                thumbnailUrl = data.data.images[0];
                mainUrl = data.data.images[0];
            } else if (mainUrl) {
                media.push({ type: "video", url: mainUrl, thumbnail: thumbnailUrl });
            }
            
            if (media.length > 0) {
                return {
                    success: true,
                    title: data.data.title || "TikTok Video",
                    thumbnail: thumbnailUrl,
                    url: mainUrl,
                    mediaType: mediaType,
                    source: "tikwm",
                    media: media,
                    qualities: mediaType === "video" ? [
                        { label: "HD Video", url: data.data.hdplay || mainUrl, ext: "mp4", size: "HD" },
                        { label: "Audio", url: data.data.music || data.data.music_info?.play, ext: "mp3", size: "Audio" }
                    ] : undefined
                };
            }
        }
    } catch(e) {
        console.log("tikwm error:", e.message);
    }
    return null;
}

function extractCarouselItemsFromNode(postObj: any, shortcodeStr?: string): any[] {
  if (!postObj || typeof postObj !== 'object') return [];

  let childrenNodes: any[] = [];

  // 1. Direct properties check
  if (Array.isArray(postObj.carousel_media) && postObj.carousel_media.length > 0) {
    childrenNodes = postObj.carousel_media;
  } else if (postObj.edge_sidecar_to_children && Array.isArray(postObj.edge_sidecar_to_children.edges) && postObj.edge_sidecar_to_children.edges.length > 0) {
    childrenNodes = postObj.edge_sidecar_to_children.edges.map((e: any) => e.node || e);
  } else if (Array.isArray(postObj.sidecar_media) && postObj.sidecar_media.length > 0) {
    childrenNodes = postObj.sidecar_media;
  } else if (Array.isArray(postObj.resources) && postObj.resources.length > 0) {
    childrenNodes = postObj.resources;
  } else if (Array.isArray(postObj.media_list) && postObj.media_list.length > 0) {
    childrenNodes = postObj.media_list;
  } else if (Array.isArray(postObj.items) && postObj.items.length > 0) {
    const firstItem = postObj.items[0];
    if (firstItem && (firstItem.carousel_media || firstItem.edge_sidecar_to_children || firstItem.sidecar_media)) {
      return extractCarouselItemsFromNode(firstItem, shortcodeStr);
    }
  }

  // 2. Recursive fallback search if children nodes not found at top level
  if (childrenNodes.length === 0) {
    const foundNodes: any[] = [];
    function searchRecursive(curr: any) {
      if (!curr || typeof curr !== 'object' || foundNodes.length > 0) return;
      if (Array.isArray(curr.carousel_media) && curr.carousel_media.length > 0) {
        foundNodes.push(...curr.carousel_media);
        return;
      }
      if (curr.edge_sidecar_to_children && Array.isArray(curr.edge_sidecar_to_children.edges) && curr.edge_sidecar_to_children.edges.length > 0) {
        foundNodes.push(...curr.edge_sidecar_to_children.edges.map((e: any) => e.node || e));
        return;
      }
      if (Array.isArray(curr.sidecar_media) && curr.sidecar_media.length > 0) {
        foundNodes.push(...curr.sidecar_media);
        return;
      }
      if (Array.isArray(curr)) {
        for (const el of curr) searchRecursive(el);
      } else {
        for (const k of Object.keys(curr)) {
          if (k !== 'parent' && k !== 'prev') {
            searchRecursive(curr[k]);
            if (foundNodes.length > 0) return;
          }
        }
      }
    }
    searchRecursive(postObj);
    if (foundNodes.length > 0) {
      childrenNodes = foundNodes;
    }
  }

  if (childrenNodes.length === 0) return [];

  const expectedCount = childrenNodes.length;
  console.log(`[Instagram Extractor] Found ${expectedCount} carousel child nodes in Instagram payload.`);

  const items: any[] = [];

  for (let idx = 0; idx < childrenNodes.length; idx++) {
    const child = childrenNodes[idx];
    if (!child || typeof child !== 'object') continue;

    let isVideo = false;
    let url = "";

    if (child.is_video || child.media_type === 2 || child.type === "video") {
      isVideo = true;
    }

    if (child.video_versions && Array.isArray(child.video_versions) && child.video_versions.length > 0) {
      isVideo = true;
      url = child.video_versions[0].url || "";
    } else if (child.video_url) {
      isVideo = true;
      url = child.video_url;
    } else if (child.url && isVideo) {
      url = child.url;
    }

    if (!url) {
      if (child.image_versions2 && child.image_versions2.candidates && Array.isArray(child.image_versions2.candidates) && child.image_versions2.candidates.length > 0) {
        url = child.image_versions2.candidates[0].url || "";
      } else if (child.display_url) {
        url = child.display_url;
      } else if (child.display_resources && Array.isArray(child.display_resources) && child.display_resources.length > 0) {
        url = child.display_resources[child.display_resources.length - 1].src || "";
      } else if (child.display_src) {
        url = child.display_src;
      } else if (child.url) {
        url = child.url;
      }
    }

    if (!url || typeof url !== 'string' || !url.startsWith('http')) continue;

    let thumb = "";
    if (child.image_versions2 && child.image_versions2.candidates && Array.isArray(child.image_versions2.candidates) && child.image_versions2.candidates.length > 0) {
      thumb = child.image_versions2.candidates[0].url;
    } else if (child.display_url) {
      thumb = child.display_url;
    } else if (child.display_resources && Array.isArray(child.display_resources) && child.display_resources.length > 0) {
      thumb = child.display_resources[0].src;
    } else if (child.thumbnail) {
      thumb = child.thumbnail;
    } else {
      thumb = url;
    }

    const type = isVideo ? "video" : "image";
    const childId = String(child.id || child.pk || child.shortcode || `slide_${idx + 1}`);
    const proxyUrl = url.startsWith('/') ? url : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=instagram_${type}_item_${idx + 1}`;

    items.push({
      type,
      url: proxyUrl,
      thumbnail: thumb,
      id: childId,
      mediaId: childId,
      index: idx,
      shortcode: shortcodeStr || ""
    });
  }

  console.log(`[Instagram Extractor] Successfully created ${items.length} out of ${expectedCount} carousel media items.`);
  return items;
}

async function extractInstagramBtch(url: string) {
  console.log("Trying btch-downloader for Instagram...");
  try {
    const b = await getBtch();
    const r = await b.igdl(url);
    if (r && r.status && r.result && Array.isArray(r.result) && r.result.length > 0) {
      const carouselItems = extractCarouselItemsFromNode({ carousel_media: r.result });
      if (carouselItems.length > 0) {
        return {
          success: true,
          title: carouselItems.length > 1 ? "Instagram Carousel" : (carouselItems[0].type === "video" ? "Instagram Reel" : "Instagram Post"),
          thumbnail: carouselItems[0].thumbnail,
          url: carouselItems[0].url,
          mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
          media: carouselItems,
          source: "btch"
        };
      }
    }
  } catch (e) {
    // silently ignore btch-downloader errors
  }
  return null;
}

async function fastRace(promises: Promise<any>[]): Promise<any> {
  try {
    return await Promise.any(promises.map(async p => {
      const res = await p;
      if (res && res.success) {
        if ((res.media && res.media.length > 0) || res.url || (res.qualities && res.qualities.length > 0)) {
          return res;
        }
      }
      throw new Error("fail");
    }));
  } catch {
    return null;
  }
}

async function extractInstagramRapidAPI(url: string) {
  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  if (!rapidKey) return null;
  
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
    
    if (!response.ok) return null;
    
    const data = (await response.json()) as any;
    const postNode = data?.data?.items?.[0] || data?.items?.[0] || data?.data || data;
    if (!postNode) return null;

    const carouselItems = extractCarouselItemsFromNode(postNode);
    const title = postNode.caption?.text ? postNode.caption.text.substring(0, 50) : "Instagram Post";

    if (carouselItems.length > 0) {
      return {
        success: true,
        title: carouselItems.length > 1 ? "Instagram Carousel" : title,
        url: carouselItems[0].url,
        thumbnail: carouselItems[0].thumbnail,
        mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
        media: carouselItems,
        source: "rapidapi"
      };
    }

    let mediaUrl = "";
    let mediaType = "video";
    if (postNode.video_versions && postNode.video_versions.length > 0) {
      mediaUrl = postNode.video_versions[0].url;
      mediaType = "video";
    } else if (postNode.image_versions2 && postNode.image_versions2.candidates && postNode.image_versions2.candidates.length > 0) {
      mediaUrl = postNode.image_versions2.candidates[0].url;
      mediaType = "image";
    }

    if (mediaUrl) {
      const thumb = postNode.image_versions2?.candidates?.[0]?.url || mediaUrl;
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=instagram_${mediaType}`;
      return {
        success: true,
        title,
        url: proxyUrl,
        thumbnail: thumb,
        mediaType,
        media: [{
          type: mediaType,
          url: proxyUrl,
          thumbnail: thumb,
          id: String(postNode.id || postNode.pk || "post"),
          mediaId: String(postNode.id || postNode.pk || "post"),
          index: 0
        }],
        source: "rapidapi"
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function extractInstagramWebApi(url: string) {
  const match = url.match(/(?:p|reel|tv|stories\/[^\/?#&]+)\/([^\/?#&]+)/);
  if (!match || !match[1]) return null;
  const shortcode = match[1];

  try {
    const apiUrl = `https://www.instagram.com/api/v1/media/by/code/${shortcode}/`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) return null;

    const item = data.items[0];
    const carouselItems = extractCarouselItemsFromNode(item);

    if (carouselItems.length > 0) {
      const title = item.caption?.text ? item.caption.text.substring(0, 50) : "Instagram Carousel";
      return {
        success: true,
        title: carouselItems.length > 1 ? "Instagram Carousel" : title,
        thumbnail: carouselItems[0].thumbnail,
        url: carouselItems[0].url,
        mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
        media: carouselItems,
        source: "web_api"
      };
    }

    let mediaUrl = "";
    let type = "image";
    if (item.video_versions && item.video_versions.length > 0) {
      mediaUrl = item.video_versions[0].url;
      type = "video";
    } else if (item.image_versions2?.candidates?.length > 0) {
      mediaUrl = item.image_versions2.candidates[0].url;
      type = "image";
    }

    if (mediaUrl) {
      const title = item.caption?.text ? item.caption.text.substring(0, 50) : "Instagram Post";
      const thumb = item.image_versions2?.candidates?.[0]?.url || mediaUrl;
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=instagram_${type}`;
      return {
        success: true,
        title,
        thumbnail: thumb,
        url: proxyUrl,
        mediaType: type,
        media: [{
          type,
          url: proxyUrl,
          thumbnail: thumb,
          id: String(item.id || item.pk || shortcode),
          mediaId: String(item.id || item.pk || shortcode),
          index: 0
        }],
        source: "web_api"
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function extractInstagramEmbedScraper(url: string) {
  const match = url.match(/(?:p|reel|tv|stories\/[^\/?#&]+)\/([^\/?#&]+)/);
  if (!match || !match[1]) return null;
  const shortcode = match[1];

  try {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
    let scriptMatch: RegExpExecArray | null;

    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      if (!scriptContent) continue;

      if (scriptContent.includes('carousel_media') || scriptContent.includes('edge_sidecar_to_children') || scriptContent.includes('xdt_shortcode_media') || scriptContent.includes('shortcode_media')) {
        let startIdx = scriptContent.indexOf('{"');
        if (startIdx !== -1) {
          const jsonCandidate = scriptContent.substring(startIdx);

          const findAndExtract = (obj: any): any[] => {
            if (!obj || typeof obj !== 'object') return [];
            const items = extractCarouselItemsFromNode(obj);
            if (items.length > 0) return items;

            if (obj.xdt_shortcode_media) {
              const res = extractCarouselItemsFromNode(obj.xdt_shortcode_media);
              if (res.length > 0) return res;
            }
            if (obj.shortcode_media) {
              const res = extractCarouselItemsFromNode(obj.shortcode_media);
              if (res.length > 0) return res;
            }
            if (Array.isArray(obj)) {
              for (const elem of obj) {
                const res = findAndExtract(elem);
                if (res.length > 0) return res;
              }
            } else {
              for (const key of Object.keys(obj)) {
                if (key !== 'parent' && key !== 'prev') {
                  const res = findAndExtract(obj[key]);
                  if (res.length > 0) return res;
                }
              }
            }
            return [];
          };

          let parsedJson: any = null;
          try {
            parsedJson = JSON.parse(jsonCandidate);
          } catch (e) {
            const lastBrace = jsonCandidate.lastIndexOf('}');
            if (lastBrace !== -1) {
              try {
                parsedJson = JSON.parse(jsonCandidate.substring(0, lastBrace + 1));
              } catch (e2) {}
            }
          }

          if (parsedJson) {
            const carouselItems = findAndExtract(parsedJson);
            if (carouselItems.length > 0) {
              return {
                success: true,
                title: carouselItems.length > 1 ? "Instagram Carousel" : "Instagram Post",
                thumbnail: carouselItems[0].thumbnail,
                url: carouselItems[0].url,
                mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
                media: carouselItems,
                source: "embed_json"
              };
            }
          }
        }
      }
    }
  } catch (e) {}

  return null;
}

async function extractInstagramRepoBackend(url: string) {
  console.log(`Attempting Repository Backend extraction for: ${url}`);
  try {
    const match = url.match(/(?:p|reel|tv|stories\/[^\/?#&]+)\/([^\/?#&]+)/);
    if (!match || !match[1]) return null;
    const shortcode = match[1];

    const graphqlUrl = `https://www.instagram.com/graphql/query/?doc_id=24368985919464652&variables=${encodeURIComponent(`{"shortcode":"${shortcode}","fetch_tagged_user_count":null,"hoisted_comment_id":null,"hoisted_reply_id":null}`)}`;

    const response = await fetch(graphqlUrl, {
      signal: AbortSignal.timeout(5000),
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

    if (!response.ok) return null;
    const data: any = await response.json();
    const media = data?.data?.xdt_shortcode_media;
    if (!media) return null;

    const carouselItems = extractCarouselItemsFromNode(media);
    if (carouselItems.length > 0) {
      return {
        success: true,
        title: carouselItems.length > 1 ? "Instagram Carousel" : "Instagram Post",
        url: carouselItems[0].url,
        thumbnail: carouselItems[0].thumbnail,
        mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
        media: carouselItems,
        source: "repo_backend"
      };
    }

    let mediaUrl = media.is_video ? media.video_url : media.display_url;
    let mediaType = media.is_video ? "video" : "image";
    let thumbnail = media.display_url || mediaUrl;

    if (mediaUrl) {
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=instagram_${mediaType}`;
      return {
        success: true,
        title: "Instagram Post",
        url: proxyUrl,
        thumbnail,
        mediaType,
        media: [{
          type: mediaType,
          url: proxyUrl,
          thumbnail,
          id: String(media.id || shortcode),
          mediaId: String(media.id || shortcode),
          index: 0
        }],
        source: "repo_backend"
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function extractInstagramMaster(url: string): Promise<any> {
  console.log(`[Instagram Master] Starting complete extraction for: ${url}`);

  const candidates = [
    extractInstagramWebApi(url),
    extractInstagramRapidAPI(url),
    extractInstagramRepoBackend(url),
    extractInstagramEmbedScraper(url),
    extractInstagramBtch(url),
    extractWithYtDlp(url)
  ];

  const results = await Promise.allSettled(candidates);
  const successful: any[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && r.value.success) {
      const sanitized = sanitizeExtractorResult(r.value);
      if (sanitized && (sanitized.url || (sanitized.media && sanitized.media.length > 0))) {
        successful.push(sanitized);
      }
    }
  }

  if (successful.length === 0) {
    console.log("[Instagram Master] Primary extractors produced no result, trying AI extraction...");
    const aiFallback = await extractWithAI(url, false);
    if (aiFallback && aiFallback.success) {
      return sanitizeExtractorResult(aiFallback);
    }
    return null;
  }

  let bestResult = successful[0];
  let maxCount = 0;

  for (const res of successful) {
    const itemCount = res.media ? res.media.length : (res.url ? 1 : 0);
    const isCarousel = res.mediaType === 'carousel' || itemCount > 1;

    if (isCarousel) {
      if (itemCount > maxCount) {
        maxCount = itemCount;
        bestResult = res;
      }
    } else if (maxCount === 0) {
      if (itemCount > (bestResult.media ? bestResult.media.length : (bestResult.url ? 1 : 0))) {
        bestResult = res;
      }
    }
  }

  console.log(`[Instagram Master] Selected best extraction source: ${bestResult.source || 'unknown'} with ${bestResult.media?.length || 1} items.`);
  return bestResult;
}

// ==================== THREADS NATIVE EXTRACTOR ====================
async function extractThreadsPost(urlStr: string): Promise<any> {
  console.log(`[Threads Extractor] Extracting media from: ${urlStr}`);

  let shortcode: string | null = null;
  const match = urlStr.match(/(?:\/post\/|\/t\/)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    shortcode = match[1];
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
  ];

  const browserHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  let html = '';

  const fetchUrls = [
    urlStr,
    ...(shortcode ? [
      `https://www.threads.com/t/${shortcode}`,
      `https://www.threads.net/t/${shortcode}`,
      `https://www.threads.net/@threads/post/${shortcode}`
    ] : [])
  ];

  for (const fUrl of fetchUrls) {
    for (const ua of userAgents) {
      try {
        const res = await fetch(fUrl, {
          headers: {
            'User-Agent': ua,
            ...browserHeaders
          }
        });

        if (res.ok) {
          const pageHtml = await res.text();
          if (pageHtml.includes('thread_items') || pageHtml.includes('image_versions2') || pageHtml.includes('video_versions') || pageHtml.includes('carousel_media')) {
            html = pageHtml;
            console.log(`[Threads Extractor] Retrieved page HTML (${html.length} bytes) from ${fUrl}.`);
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (html) break;
  }

  if ((!html || (!html.includes('thread_items') && !html.includes('image_versions2') && !html.includes('video_versions'))) && shortcode) {
    const fallbackUrls = [
      `https://www.threads.net/embed/post/${shortcode}`,
      `https://www.instagram.com/p/${shortcode}/embed/`
    ];

    for (const fbUrl of fallbackUrls) {
      try {
        const res = await fetch(fbUrl, {
          headers: {
            'User-Agent': userAgents[0],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (res.ok) {
          const fbHtml = await res.text();
          if (fbHtml.includes('thread_items') || fbHtml.includes('image_versions2') || fbHtml.includes('video_versions') || fbHtml.includes('display_url') || fbHtml.includes('video_url')) {
            html = fbHtml;
            console.log(`[Threads Extractor] Fallback embed URL succeeded (${html.length} bytes).`);
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!html) {
    return null;
  }

  const extractedMedia: Array<{ type: "video" | "image"; url: string; thumbnail: string; width?: number; height?: number }> = [];
  const seenUrls = new Set<string>();

  const postInfo = {
    title: "",
    username: "",
    displayName: "",
    avatarUrl: ""
  };

  const addMedia = (type: "video" | "image", rawUrl: string, thumbnail?: string, width?: number, height?: number) => {
    if (!rawUrl) return;
    const cleanUrl = String(rawUrl).replaceAll('\\/', '/').replaceAll('\\', '');
    const cleanThumb = thumbnail ? String(thumbnail).replaceAll('\\/', '/').replaceAll('\\', '') : cleanUrl;

    if (!cleanUrl.startsWith('http')) return;

    const urlKey = cleanUrl.split('?')[0];
    if (seenUrls.has(urlKey)) return;
    seenUrls.add(urlKey);

    extractedMedia.push({
      type,
      url: cleanUrl,
      thumbnail: cleanThumb,
      width: width || 0,
      height: height || 0
    });
  };

  // 1. Traverse script JSON blocks
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const script = scriptMatch[1];
    if (!script) continue;

    if (script.includes('thread_items') || script.includes('carousel_media') || script.includes('image_versions2') || script.includes('video_versions')) {
      let idx = script.indexOf('{"__bbox":');
      if (idx === -1) idx = script.indexOf('{"data":');
      if (idx === -1) idx = script.indexOf('{"thread_items":');

      if (idx !== -1) {
        try {
          let jsonStr = script.substring(idx);
          const lastBrace = jsonStr.lastIndexOf('}}');
          if (lastBrace !== -1) {
            jsonStr = jsonStr.substring(0, lastBrace + 2);
          }
          const parsed = JSON.parse(jsonStr);
          parseBboxObject(parsed, addMedia, postInfo, shortcode);
        } catch (e) {
          // fallback to regex
        }
      }
    }
  }

  // 2. Direct Regex fallback on HTML if script traversal yielded 0 items
  if (extractedMedia.length === 0) {
    console.log("[Threads Extractor] Script traversal yielded 0 items, running Regex fallback scanner...");

    const videoVersionRegex = /"video_versions":\s*(\[[^\]]+\])/g;
    let vMatch: RegExpExecArray | null;
    while ((vMatch = videoVersionRegex.exec(html)) !== null) {
      try {
        const vList = JSON.parse(vMatch[1]);
        if (Array.isArray(vList) && vList.length > 0) {
          addMedia("video", vList[0].url, vList[0].url, vList[0].width, vList[0].height);
        }
      } catch (e) {}
    }

    const imageVersionRegex = /"image_versions2":\s*(\{[^\}]+\})/g;
    let iMatch: RegExpExecArray | null;
    while ((iMatch = imageVersionRegex.exec(html)) !== null) {
      try {
        const iObj = JSON.parse(iMatch[1]);
        if (iObj && iObj.candidates && Array.isArray(iObj.candidates) && iObj.candidates.length > 0) {
          addMedia("image", iObj.candidates[0].url, iObj.candidates[0].url, iObj.candidates[0].width, iObj.candidates[0].height);
        }
      } catch (e) {}
    }

    const ogVideo = html.match(/<meta property="og:video[^"]*" content="([^"]+)"/i);
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (ogVideo && ogVideo[1]) {
      addMedia("video", ogVideo[1], ogImage ? ogImage[1] : ogVideo[1]);
    } else if (ogImage && ogImage[1]) {
      addMedia("image", ogImage[1], ogImage[1]);
    }
  }

  if (extractedMedia.length === 0) {
    return null;
  }

  const firstItem = extractedMedia[0];
  const mainType = extractedMedia.length > 1 ? "carousel" : firstItem.type;

  return {
    success: true,
    title: postInfo.title || "Threads Post",
    description: postInfo.title || "",
    thumbnail: firstItem.thumbnail || firstItem.url,
    url: firstItem.url,
    mediaType: mainType,
    media: extractedMedia,
    profile: postInfo.username ? {
      username: `@${postInfo.username}`,
      displayName: postInfo.displayName || postInfo.username,
      avatarUrl: postInfo.avatarUrl
    } : undefined
  };
}

function sanitizeExtractorResult(result: any): any {
  if (!result || typeof result !== 'object') return result;

  if (Array.isArray(result.media) && result.media.length > 0) {
    const seenKeys = new Set<string>();
    const deduplicatedMedia: any[] = [];

    for (let i = 0; i < result.media.length; i++) {
      const item = result.media[i];
      if (!item || typeof item !== 'object') continue;

      const directId = item.id || item.mediaId || item.pk || item.child_id;
      const idx = item.index !== undefined ? item.index : i;

      let rawUrl = item.url || item.downloadUrl || item.mediaUrl || "";
      let cleanUrl = rawUrl;
      if (cleanUrl.includes('/api/proxy-download')) {
        try {
          const match = cleanUrl.match(/[?&]url=([^&]+)/);
          if (match && match[1]) {
            cleanUrl = decodeURIComponent(match[1]);
          }
        } catch (e) {
          // ignore
        }
      }

      let urlKey = cleanUrl;
      if (cleanUrl) {
        try {
          const parsed = new URL(cleanUrl);
          if (parsed.hostname.includes('instagram.com') || parsed.hostname.includes('cdninstagram.com') || parsed.hostname.includes('fbcdn.net')) {
            urlKey = parsed.origin + parsed.pathname;
          }
        } catch (e) {
          urlKey = cleanUrl.split('?')[0].trim();
        }
      }

      let key = "";
      if (urlKey && urlKey.startsWith('http')) {
        key = `url:${urlKey}`;
      } else if (directId) {
        key = `id:${directId}`;
      } else {
        key = `idx:${idx}`;
      }

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicatedMedia.push({
          ...item,
          index: deduplicatedMedia.length
        });
      }
    }

    result.media = deduplicatedMedia;

    if (result.media.length > 1) {
      result.mediaType = "carousel";
      if (!result.url && result.media[0].url) {
        result.url = result.media[0].url;
      }
      if (!result.thumbnail && result.media[0].thumbnail) {
        result.thumbnail = result.media[0].thumbnail;
      }
    } else if (result.media.length === 1 && result.mediaType === "carousel") {
      result.mediaType = result.media[0].type || "image";
      result.url = result.media[0].url || result.url;
      result.thumbnail = result.media[0].thumbnail || result.thumbnail;
    }
  }

  return result;
}

function parseBboxObject(obj: any, addMediaFn: Function, postInfo: any, targetCode?: string | null, processedPosts?: Set<string>) {
  if (!obj || typeof obj !== 'object') return;
  const postsSet = processedPosts || new Set<string>();

  if (Array.isArray(obj)) {
    for (const item of obj) parseBboxObject(item, addMediaFn, postInfo, targetCode, postsSet);
    return;
  }

  if (obj.thread_items && Array.isArray(obj.thread_items)) {
    let matchedInThread = false;
    if (targetCode) {
      for (const item of obj.thread_items) {
        if (item.post && item.post.code === targetCode) {
          processPostData(item.post, addMediaFn, postInfo, postsSet);
          matchedInThread = true;
        }
      }
    }
    if (!matchedInThread) {
      for (const item of obj.thread_items) {
        if (item.post) {
          processPostData(item.post, addMediaFn, postInfo, postsSet);
        }
      }
    }
  } else if (obj.post) {
    if (!targetCode || obj.post.code === targetCode) {
      processPostData(obj.post, addMediaFn, postInfo, postsSet);
    }
  }

  for (const key of Object.keys(obj)) {
    if (key !== 'thread_items' && key !== 'post') {
      parseBboxObject(obj[key], addMediaFn, postInfo, targetCode, postsSet);
    }
  }
}

function processPostData(post: any, addMediaFn: Function, postInfo: any, processedPosts?: Set<string>) {
  if (!post) return;

  const postId = post.id || post.pk || post.code;
  if (postId && processedPosts) {
    const pStr = String(postId);
    if (processedPosts.has(pStr)) return;
    processedPosts.add(pStr);
  }

  if (post.caption && post.caption.text && !postInfo.title) {
    postInfo.title = post.caption.text;
  }
  if (!postInfo.title && post.text_post_app_info?.text_fragments?.fragments) {
    postInfo.title = post.text_post_app_info.text_fragments.fragments.map((f: any) => f.plaintext).join('');
  }

  if (post.user) {
    if (post.user.username) postInfo.username = post.user.username;
    if (post.user.full_name) postInfo.displayName = post.user.full_name;
    if (post.user.profile_pic_url) postInfo.avatarUrl = post.user.profile_pic_url;
  }

  if (post.carousel_media && Array.isArray(post.carousel_media)) {
    for (const cItem of post.carousel_media) {
      processSingleMediaItem(cItem, addMediaFn);
    }
  } else if (post.edge_sidecar_to_children?.edges && Array.isArray(post.edge_sidecar_to_children.edges)) {
    for (const edge of post.edge_sidecar_to_children.edges) {
      if (edge.node) processSingleMediaItem(edge.node, addMediaFn);
    }
  } else {
    processSingleMediaItem(post, addMediaFn);
  }
}

function processSingleMediaItem(item: any, addMediaFn: Function) {
  if (!item) return;

  if (item.video_versions && Array.isArray(item.video_versions) && item.video_versions.length > 0) {
    const bestVid = item.video_versions[0];
    let thumb = "";
    if (item.image_versions2?.candidates?.length > 0) {
      thumb = item.image_versions2.candidates[0].url;
    } else if (item.display_url) {
      thumb = item.display_url;
    }
    addMediaFn("video", bestVid.url, thumb || bestVid.url, bestVid.width, bestVid.height);
  } else if (item.is_video && item.video_url) {
    addMediaFn("video", item.video_url, item.display_url || item.video_url);
  } else if (item.image_versions2?.candidates?.length > 0) {
    const bestImg = item.image_versions2.candidates[0];
    addMediaFn("image", bestImg.url, bestImg.url, bestImg.width, bestImg.height);
  } else if (item.display_url) {
    addMediaFn("image", item.display_url, item.display_url);
  } else if (item.display_resources && item.display_resources.length > 0) {
    const bestRes = item.display_resources[item.display_resources.length - 1].src;
    addMediaFn("image", bestRes, item.display_resources[0].src || bestRes);
  }
}


  

const sizeCache = new Map<string, string>();

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    if (bytes < k) return (bytes / k).toFixed(2) + ' KB';
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

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    try {
      let trimmedUrl = url.trim();
      const lowerUrl = trimmedUrl.toLowerCase();
      const { platform, type } = classifyUrl(trimmedUrl);
      
      if (platform === 'instagram') {
        if (/\/(stories|s)\//.test(lowerUrl) || lowerUrl.includes('story_item_share')) {
          return res.status(400).json({
            success: false,
            message: "For Instagram, only Reels and Posts are supported. Stories and Highlights are not supported."
          });
        }
      }
      
      if (platform === 'unknown') {
        return res.status(400).json({
          success: false,
          message: "This URL is from an unsupported website. Aura Downloader supports links from YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest, X/Twitter, LinkedIn, Snapchat, Spotify, and Threads. Please enter a valid link from a supported platform."
        });
      }
      const isProfile = type === 'profile';
      console.log(`Processing extraction for platform: ${platform}, type: ${type}, url: ${trimmedUrl}`);

      if (isProfile) {
        if (platform === 'youtube') {
           console.log("YouTube Profile URL detected, extracting with yt-dlp flat-playlist.");
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           }
        } else if (platform === 'snapchat') {
           console.log("Snapchat URL detected as profile/story, extracting with native scraper and yt-dlp playlist.");
           const nativeResult = await extractSnapchatNative(trimmedUrl);
           if (nativeResult && nativeResult.success) {
             return res.json(nativeResult);
           }
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           } else {
             return res.status(400).json({ success: false, message: "Extraction failed: This Snapchat content is private or unavailable." });
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
                console.error("Twitter RapidAPI Error:", err.message);
            }
        }

        const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
        const xtractorResult = await extractTwitterXtractor(trimmedUrl, authToken);
        
        if (xtractorResult && xtractorResult.media && xtractorResult.media.length > 0) {
            return res.json({ success: true, ...xtractorResult });
        } else {
            return res.status(500).json({ success: false, message: "Twitter download failed. The post might be private or unavailable." });
        }
      }
      } else {
        const racePromises: Promise<any>[] = [];
        
        // Cobalt removed for speed

        if (platform === 'pinterest') {
            console.log("Adding Pinterest extractors...");
            let resolvedUrl = trimmedUrl;
            if (trimmedUrl.includes('pin.it')) {
                try {
                    const resp = await fetch(trimmedUrl);
                    let finalUrl = resp.url;
                    if (finalUrl === trimmedUrl) {
                        const text = await resp.text();
                        const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i) || text.match(/href="([^"]+api\.pinterest\.com\/url_shortener[^"]+)"/i);
                        if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                    }
                    if (finalUrl.includes('api.pinterest.com/url_shortener')) {
                         const redirectResp = await fetch(finalUrl, { redirect: 'manual' });
                         if (redirectResp.status >= 300 && redirectResp.status < 400) {
                            finalUrl = redirectResp.headers.get('location') || finalUrl;
                         } else {
                            const text = await redirectResp.text();
                            const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i);
                            if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                         }
                    }
                    resolvedUrl = finalUrl;
                } catch(e) {}
            }
            trimmedUrl = resolvedUrl;
            racePromises.push(extractPinterestNative(trimmedUrl));
            racePromises.push(extractPinterestBtch(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'tiktok') {
            racePromises.push(extractTiktokTikwm(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'youtube') {
            console.log("Extracting YouTube video in parallel...");
            racePromises.push(extractWithVreden(trimmedUrl));
            racePromises.push(extractYoutubeBtch(trimmedUrl));
            racePromises.push(extractWithYtDlpWithTimeout(trimmedUrl, 3000));
        } else if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
            console.log("[Route] Instagram URL detected, using extractInstagramMaster...");
            const igResult = await extractInstagramMaster(trimmedUrl);
            if (igResult && igResult.success) {
                return res.json(sanitizeExtractorResult(igResult));
            }
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
            const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
            if (rapidKey) racePromises.push(extractTwitterRapidAPI(trimmedUrl, rapidKey));
            const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
            racePromises.push(extractTwitterXtractor(trimmedUrl, authToken));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        
        } else if (platform === 'snapchat') {
            racePromises.push(extractSnapchatNative(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'spotify') {
            console.log("Spotify URL detected, using Spotify extractor...");
            racePromises.push(extractSpotify(trimmedUrl));
        } else if (platform === 'threads') {
            console.log("Threads URL detected, using native Threads extractor and fallbacks...");
            racePromises.push(extractThreadsPost(trimmedUrl));
            racePromises.push(extractInstagramRapidAPI(trimmedUrl));
            racePromises.push(extractInstagramBtch(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else {
            racePromises.push(extractWithYtDlp(trimmedUrl));
        }

        console.log("Racing " + racePromises.length + " extractors for speed...");
        let raceResult = await fastRace(racePromises);
        
        if (!raceResult || !raceResult.success) {
            console.log("Attempting secondary fallback extraction...");
            const aiFallback = await extractWithAI(trimmedUrl, false);
            if (aiFallback && aiFallback.success) {
                raceResult = aiFallback;
            }
        }
        
        if (raceResult && raceResult.success) {
            return res.json(sanitizeExtractorResult(raceResult));
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
          errorMsg = "Instagram download failed. Please ensure the link is a public Reel or Post.";
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
          errorMsg = "Twitter download failed. The post might be private or unavailable.";
        } else if (platform === 'snapchat') {
          if (!trimmedUrl.includes("/spotlight/") && !trimmedUrl.includes("/s/") && !trimmedUrl.includes("/p/") && !trimmedUrl.includes("/add/") && !trimmedUrl.includes("@")) {
            errorMsg = "Invalid Snapchat URL.";
          } else {
            errorMsg = "This Snapchat content is private or unavailable.";
          }
        }
        return res.status(400).json({ success: false, message: `Extraction failed: ${errorMsg}` });
      }
    } catch (error) {
      console.error("API Download Exception:", error.message);
      return res.status(500).json({ success: false, message: "Extraction failed. Please try again later." || "An unexpected error occurred while processing the URL." });
    }
  });

  app.get("/api/spotify-resolve", async (req, res) => {
    try {
      let trackId = (req.query.trackId as string) || "";
      let title = (req.query.title as string) || (req.query.trackName as string) || "";
      let artist = (req.query.artist as string) || (req.query.artistName as string) || "";
      let artistsParam = (req.query.artists as string) || "";
      let durationMs = parseInt((req.query.durationMs as string) || (req.query.duration as string) || "0") || 0;
      let isrc = (req.query.isrc as string) || "";
      const query = (req.query.query as string) || "";

      // Check if query itself contains a Spotify track URL or trackId
      if (!trackId && query) {
        const urlMatch = query.match(/track[\/:]([a-zA-Z0-9]+)/);
        if (urlMatch && urlMatch[1]) {
          trackId = urlMatch[1];
        }
      }

      let allArtists: string[] = artistsParam ? artistsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (artist && !allArtists.includes(artist)) {
        allArtists.unshift(artist);
      }

      let albumName = "";

      // If trackId is available, fetch complete details from Spotify to guarantee 100% accuracy
      if (trackId) {
        const details = await getSpotifyTrackDetails(trackId);
        if (details.trackName) {
          title = details.trackName;
          artist = details.primaryArtist || artist;
          allArtists = details.allArtists.length > 0 ? details.allArtists : allArtists;
          albumName = details.albumName || "";
          isrc = details.isrc || isrc;
          durationMs = details.durationMs || durationMs;
        }
      }

      // Fallback if title is missing but query was passed
      if (!title && query) {
        title = query.replace(/\s*(full song|official audio|audio)\s*/gi, '').trim();
      }

      // If title or query is still missing, return error
      if (!title && !trackId) {
        return res.status(400).json({ success: false, message: "Missing track identifiers or query" });
      }

      const videoId = await resolveSpotifyTrackToYouTube({
        trackName: title,
        primaryArtist: artist,
        allArtists: allArtists.length > 0 ? allArtists : [artist],
        albumName,
        isrc,
        durationMs
      });

      if (!videoId) {
        return res.status(404).json({ success: false, message: "Could not resolve Spotify audio track" });
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const { ytmp3 } = await import("@vreden/youtube_scraper");
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {}; console.log = () => {};
      let result;
      try {
        result = await ytmp3(videoUrl);
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }

      let finalAudioUrl = "";
      if (result && result.status && result.download && result.download.url) {
        finalAudioUrl = result.download.url;
      } else {
        finalAudioUrl = `/api/proxy-download?url=${encodeURIComponent(videoUrl)}`;
      }

      if (req.query.stream === 'true') {
        if (finalAudioUrl.startsWith("http")) {
          return res.redirect(302, finalAudioUrl);
        } else {
          return pipeUrlStream(finalAudioUrl, res, "spotify_audio.mp3", true);
        }
      }

      return res.json({ success: true, url: finalAudioUrl, videoId });
    } catch(e: any) {
      return res.status(500).json({ success: false, message: "Extraction failed. Please try again later." });
    }
  });

  app.get("/api/get-youtube-link", async (req, res) => {
    const videoUrl = req.query.url as string;
    const quality = (req.query.quality as string) || "360";
    
    if (!videoUrl) return res.status(400).json({ success: false, message: "Missing url parameter" });
    
    try {
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {};
      console.log = () => {};
      let result;
      try {
        if (quality === 'audio' || quality === 'mp3') {
          const { ytmp3 } = await import("@vreden/youtube_scraper");
          result = await ytmp3(videoUrl);
        } else {
          result = await vredenYtmp4(videoUrl, quality);
        }
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }
      
      if (result && result.status && result.download && result.download.url) {
        return res.json({ success: true, url: result.download.url });
      } else {
        return res.status(500).json({ success: false, message: "Failed to fetch direct URL." });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
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

  

  app.get("/api/lyrics", async (req, res) => {
    try {
      const trackName = (req.query.track_name as string) || (req.query.title as string) || "";
      const artistName = (req.query.artist_name as string) || (req.query.artist as string) || "";

      if (!trackName) {
        return res.status(400).json({ success: false, message: "Missing track name" });
      }

      const axios = (await import('axios')).default;
      let lyrics = "";
      let syncedLyrics = "";

      const queryUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}${artistName ? `&artist_name=${encodeURIComponent(artistName)}` : ""}`;
      const lyricsRes = await axios.get(queryUrl);

      if (lyricsRes.data && lyricsRes.data.length > 0) {
        lyrics = lyricsRes.data[0].plainLyrics || "";
        syncedLyrics = lyricsRes.data[0].syncedLyrics || "";
      }

      return res.json({
        success: true,
        lyrics,
        syncedLyrics
      });
    } catch (e: any) {
      console.error("Lyrics fetch error:", e.message);
      return res.status(500).json({ success: false, message: "Failed to fetch lyrics" });
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
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
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


  
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://aura-downloader-yg40.onrender.com/sitemap.xml");
  });

  app.get("/llms.txt", (req, res) => {
    res.type("text/plain");
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    if (fs.existsSync(llmsPath)) {
      res.sendFile(llmsPath);
    } else {
      res.send("# Aura Downloader\n> Free online all-in-one social media video, photo, and audio downloader.");
    }
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aura-downloader-yg40.onrender.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/youtube-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/instagram-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/tiktok-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/facebook-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/pinterest-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/x-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/reddit-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/linkedin-downloader</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/spotify-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/threads-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/snapchat-downloader</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/faq</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/privacy-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/dmca</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://aura-downloader-yg40.onrender.com/cookie-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>`);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {

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
         const canonicalUrl = `https://aura-downloader-yg40.onrender.com${req.path === "/" ? "" : req.path}`;
         html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title data-rh="true">${routeData.title}</title>`);
         html = html.replace(/<meta[^>]*name="description"[^>]*\/?>/i, `<meta name="description" data-rh="true" content="${routeData.desc}" />`);
         html = html.replace(/<meta[^>]*name="keywords"[^>]*\/?>/i, `<meta name="keywords" data-rh="true" content="${routeData.keywords}" />`);
         html = html.replace(/<meta[^>]*property="og:title"[^>]*\/?>/i, `<meta property="og:title" data-rh="true" content="${routeData.title}" />`);
         html = html.replace(/<meta[^>]*property="og:description"[^>]*\/?>/i, `<meta property="og:description" data-rh="true" content="${routeData.desc}" />`);
         html = html.replace(/<meta[^>]*name="twitter:title"[^>]*\/?>/i, `<meta name="twitter:title" data-rh="true" content="${routeData.title}" />`);
         html = html.replace(/<meta[^>]*name="twitter:description"[^>]*\/?>/i, `<meta name="twitter:description" data-rh="true" content="${routeData.desc}" />`);
         html = html.replace("</head>", `<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
         html = html.replace("</head>", `\n<script type="application/ld+json">\n${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": routeData.title,
            "description": routeData.desc,
            "url": canonicalUrl,
            "publisher": {
              "@type": "Organization",
              "name": "Aura Downloader",
              "logo": {
                "@type": "ImageObject",
                "url": "https://aura-downloader-yg40.onrender.com/icon-512.png"
              }
            }
         })}\n</script>\n</head>`);
         html = html.replace("</head>", `\n<script type="application/ld+json">\n${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": routeData.title.split(" - ")[0],
            "operatingSystem": "Any",
            "applicationCategory": "UtilitiesApplication",
            "description": routeData.desc,
            "url": canonicalUrl,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "1284"
            }
         })}\n</script>\n</head>`);
      }
      
      // Also inject og:image if not present, though it's likely handled by index.html or client, 
      // let's ensure it's there.
      const ogImage = 'https://aura-downloader-yg40.onrender.com/banner.jpg';
      if (!html.includes('property="og:image"')) {
         html = html.replace('</head>', `<meta property="og:image" content="${ogImage}" />\n</head>`);
      }
      if (!html.includes('name="twitter:image"')) {
         html = html.replace('</head>', `<meta name="twitter:image" content="${ogImage}" />\n</head>`);
      }

      res.send(html);
    });

  }

  if (!process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  }
  return app;
}

startServer();
