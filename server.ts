import { exec, spawn } from 'child_process';
import utilSync from 'util';
import express from "express";

import path from "path";
import { createServer as createViteServer } from "vite";
import ytdl from "@distube/ytdl-core";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import { ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
import btch from "btch-downloader";
import https from "https";
import http from "http";
import { URL } from "url";

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
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
    
    // Remove heavy and unneeded DOM elements
    $('script:not([type="application/ld+json"])').remove();
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
      
      const displayName = (title && title !== "Social Media Post" && !title.includes("404") && !title.includes("Not Found")) ? title.split(" (")[0] : username;
      const avatarUrl = thumbnail || "";
      const bio = description || "";
      
      let followers = "Unknown";
      let bannerUrl = "";

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Try to find followers in YouTube HTML JSON
        const subMatch = html.match(/\{\"content\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"\}/i);
        if (subMatch) {
            followers = subMatch[1];
        } else {
            const subMatch2 = html.match(/\"simpleText\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"/i);
            if (subMatch2) {
                followers = subMatch2[1];
            }
        }

        // Try to find YouTube banner URL
        const bannerMatch = html.match(/\"banner\":\{.*?\"url\":\"(https:\/\/[^\"]+)\"/);
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
  console.error = () => {};
  try {
    console.log(`Extracting YouTube video with @vreden/youtube_scraper...`);
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
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
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
  }
  return null;
}


async function extractWithYtDlp(url: string, isPlaylist: boolean = false) {
  try {
    let args = `--js-runtimes node --no-playlist --dump-json "${url}"`;
    if (isPlaylist) {
       args = `--js-runtimes node --dump-single-json --flat-playlist --playlist-end 15 "${url}"`;
    }
    const { stdout } = await execAsync(`./yt-dlp_linux ${args}`, { timeout: 25000, maxBuffer: 1024 * 1024 * 50 });
    const data = JSON.parse(stdout);
    
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
      
      qualities = Array.from(heights.values())
        .sort((a: any, b: any) => b.height - a.height)
        .map((f: any) => {
          const hasAudio = f.acodec !== 'none';
          
          let proxyUrl = `/api/proxy-download?url=${encodeURIComponent(f.url)}&filename=${encodeURIComponent(data.title || "video")}.mp4`;
          
          // If the format has no audio, but we have a bestAudio format, we can mux them
          if (!hasAudio && bestAudio && f.ext === 'mp4' && bestAudio.ext === 'm4a') {
             proxyUrl += `&audioUrl=${encodeURIComponent(bestAudio.url)}&mux=true`;
          } else if (!hasAudio && bestAudio) {
             proxyUrl += `&audioUrl=${encodeURIComponent(bestAudio.url)}&mux=true`;
          }
          
          return {
            label: `${f.height}p (${f.ext})`,
            url: proxyUrl,
            ext: f.ext || "mp4",
            size: hasAudio || bestAudio ? "Video + Audio" : "Video Only"
          };
        });
        
      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // highest quality
         
         const audioSourceUrl = bestAudio ? bestAudio.url : data.url;
         if (audioSourceUrl) {
            qualities.push({
               label: "MP3 Audio",
               url: `/api/proxy-download?url=${encodeURIComponent(audioSourceUrl)}&filename=${encodeURIComponent(data.title || "audio")}.mp3&extractAudio=true`,
               ext: "mp3",
               size: "Audio Only"
            });
         }
      }
    }

    if (!mediaUrl && data.url) {
      mediaUrl = `/api/proxy-download?url=${encodeURIComponent(data.url)}&filename=${encodeURIComponent(data.title || "download")}.${data.ext || "mp4"}`;
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


async function extractWithAI(url: string, isProfile: boolean): Promise<any> {
  const ai = getGemini();

  let htmlContent = "";
  try {
    let crawlUrl = url;
    if (url.toLowerCase().includes("instagram.com") && !isProfile) {
      const shortcode = getInstagramShortcode(url);
      if (shortcode) {
        crawlUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
        console.log(`AI crawl: redirecting instagram url to embed url: ${crawlUrl}`);
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
    // If blocked, run Puppeteer
    
  }

  // Ensure we have some content
  if (!htmlContent) {
    console.log("Empty page content, engaging local cheerio fallback with available page reference if any.");
  }

  const condensed = cleanHTML(htmlContent || "<html><body></body></html>");

  if (!ai) {
    console.log("AI Client is not available, falling back to Cheerio.");
    return localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
  }

  const systemInstruction = `You are an expert Social Media scraper and metadata parser. Your job is to analyze the provided condensed HTML context of a webpage and extract direct media URLs, profile avatar/banner images, titles, and stats.

CRITICAL DIRECTIVES:
1. Locate high-quality direct download or stream URLs. Look for CDN patterns, source tags, og:video, og:image, and JSON blobs.
2. If this is a profile page (YouTube channel, Instagram user, TikTok user, Facebook profile, Pinterest profile, LinkedIn profile), extract user profile information: avatar picture URL (high res), banner picture URL, display name, follower counts, bio.
3. If this is a profile page or community post, ALWAYS extract up to 15 recent media posts (videos, shorts, photos, reels, gallery) from the profile (if available in the HTML). Put these in the "media" array with the appropriate type ("video" or "image").
4. If this is a post containing multiple images (Instagram carousel, YouTube community post, Facebook gallery), return ALL extracted media items in the "media" array.
5. If it's a video, get the highest quality .mp4 or .m3u8 stream.
6. Return the result strictly in JSON format matching the response schema. No conversational wrapper or markdown formatting.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      success: { type: Type.BOOLEAN },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      thumbnail: { type: Type.STRING },
      url: { type: Type.STRING, description: "The primary direct download URL of the video or image." },
      mediaType: { 
        type: Type.STRING, 
        description: "One of: 'video', 'image', 'profile', 'carousel'" 
      },
      media: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            type: { type: Type.STRING, description: "Either 'video' or 'image'" },
            thumbnail: { type: Type.STRING }
          },
          required: ["url", "type"]
        }
      },
      profile: {
        type: Type.OBJECT,
        properties: {
          username: { type: Type.STRING },
          displayName: { type: Type.STRING },
          avatarUrl: { type: Type.STRING },
          bannerUrl: { type: Type.STRING },
          bio: { type: Type.STRING },
          followers: { type: Type.STRING },
          following: { type: Type.STRING },
          postsCount: { type: Type.STRING }
        },
        required: ["username"]
      }
    },
    required: ["success"]
  };

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting AI extraction using model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Analyze this content and build extraction response for URL: ${url}\n\nCONTENT:\n${condensed}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
        }
      });

      if (response && response.text) {
        const data = JSON.parse(response.text.trim());
        
        // Merge with Cheerio fallback to correct any hallucinated hashes by AI
        try {
            const localData = localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
            if (isProfile && localData && localData.success && localData.profile) {
                if (!data.profile) data.profile = { username: localData.profile.username };
                if (localData.profile.avatarUrl) {
                     data.profile.avatarUrl = localData.profile.avatarUrl;
                     data.thumbnail = localData.profile.avatarUrl;
                }
                if (localData.profile.bannerUrl) {
                     data.profile.bannerUrl = localData.profile.bannerUrl;
                }
                if (localData.profile.followers && localData.profile.followers !== "Unknown") {
                     data.profile.followers = localData.profile.followers;
                }
                if (localData.profile.displayName) {
                     data.profile.displayName = localData.profile.displayName;
                }
            } else if (!isProfile && localData && localData.success) {
                if (localData.thumbnail) data.thumbnail = localData.thumbnail;
                if (localData.url && (!data.url || !data.url.startsWith("http"))) data.url = localData.url;
            }
        } catch (mergeErr) {
            console.log("Merge err: ", mergeErr);
        }

        if (data && data.success) {
          console.log(`Successfully completed metadata extraction using ${modelName}`);
          return data;
        }
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or was overloaded:`, err.message || err);
      // Wait slightly
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Fallback to Cheerio if everything else fails
  console.log("All Gemini AI models returned 503 or were overloaded. Engaging high-fidelity local Cheerio parser.");
  return localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
}

// Helper to extract the Instagram shortcode
function getInstagramShortcode(url: string): string | null {
  try {
    const cleaned = url.split("?")[0].split("#")[0];
    const parts = cleaned.split("/").filter(Boolean);
    const index = parts.findIndex(p => p === "p" || p === "reel" || p === "tv" || p === "reels");
    if (index !== -1 && parts[index + 1]) {
      return parts[index + 1];
    }
    const match = url.match(/(?:\/p\/|\/reel\/|\/tv\/|\/reels\/)([a-zA-Z0-9_-]{11,15})/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
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
function classifyUrl(urlStr: string) {
  const url = urlStr.toLowerCase().trim();
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'unknown' = 'unknown';
  let type: 'profile' | 'community_post' | 'media' | 'playlist' = 'media';

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    platform = 'youtube';
    if (url.includes("/playlist")) {
      type = 'playlist';
    } else if (url.includes("/channel/") || url.includes("/c/") || url.includes("/@") || url.includes("/community") || url.includes("/post/")) {
      if (url.includes("/post/") || url.includes("lb=")) {
        type = 'community_post';
      } else {
        type = 'profile';
      }
    }
  } else if (url.includes("instagram.com")) {
    platform = 'instagram';
    if (!url.includes("/p/") && !url.includes("/reel/") && !url.includes("/tv/") && !url.includes("/stories/")) {
      const path = urlStr.split("instagram.com")[1] || "";
      const segments = path.split("?")[0].split("/").filter(Boolean);
      if (segments.length === 1) {
        type = 'profile';
      }
    }
  } else if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
    platform = 'facebook';
    if (url.includes("/profile.php") || url.includes("/people/") || (!url.includes("/videos/") && !url.includes("/reel/") && !url.includes("/watch") && !url.includes("/posts/") && !url.includes("/photo.php"))) {
      const path = urlStr.split(/facebook\.com|fb\.com/)[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("tiktok.com")) {
    platform = 'tiktok';
    if (!url.includes("/video/")) {
      const path = urlStr.split("tiktok.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1 && segments[0].startsWith("@")) {
          type = 'profile';
        }
      }
    }
  } else if (url.includes("whatsapp.com") || url.includes("wa.me")) {
    platform = 'unknown'; // handle via AI/yt-dlp
  } else if (url.includes("reddit.com") || url.includes("redd.it")) {
    platform = 'reddit';
    if (url.includes("/user/") || url.includes("/u/")) {
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
      type = 'community_post';
    }
  }
  return { platform, type };
}


// Robust download streaming helper supporting redirects and client aborts
function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5) {
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
        pipeUrlStream(redirectUrl, res, customFilename, inline, maxRedirects - 1);
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

      response.pipe(res);
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


export async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.get("/api/ping", (req, res) => {
    res.status(200).send("ok");
  });

  
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
           return {
             success: true,
             title: "Instagram Video",
             url: data.data[0].url,
             mediaType: "video",
             qualities: getFallbackQualities(data.data[0].url, "video"),
             media: data.data.map((m: any) => ({ type: "video", url: m.url, thumbnail: m.thumbnail || "" }))
           };
        }

        if (data.status === "redirect" || data.status === "stream" || data.status === "success") {
          return {
            success: true,
            title: "Extracted Media",
            url: data.url,
            mediaType: "video",
            qualities: getFallbackQualities(data.url, "video"),
            media: [{ type: "video", url: data.url }]
          };
        }
        if (data.status === "picker") {
          // Multiple items
          const media = data.picker.map((item: any) => ({
            type: item.type === "video" ? "video" : "image",
            url: item.url,
            thumbnail: item.thumb || ""
          }));
          return {
            success: true,
            title: "Extracted Media",
            url: media[0]?.url,
            mediaType: media[0]?.type,
            media: media
          };
        }
      }
    } catch (e) {
      // Ignore fallback failures
    }
  }
  return null;
}

  app.post("/api/download", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    try {
      const trimmedUrl = url.trim();
      const lowerUrl = trimmedUrl.toLowerCase();
      const { platform, type } = classifyUrl(trimmedUrl);
      const isProfile = type === 'profile' || type === 'community_post';
      console.log(`Processing extraction for platform: ${platform}, type: ${type}, url: ${trimmedUrl}`);

      if (isProfile) {
        if (platform === 'youtube') {
           console.log("YouTube Profile URL detected, extracting with yt-dlp flat-playlist.");
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           }
        } else {
          console.log("Profile URL detected, bypassing media extractors and using AI extraction directly.");
          const aiResult = await extractWithAI(trimmedUrl, true);
          if (aiResult && aiResult.success) {
            return res.json(aiResult);
          } else {
             // fallback to other extractors if AI profile extraction fails completely
          }
        }
      }

      if (type === 'playlist' && platform === 'youtube') {
        console.log("Playlist URL detected, extracting with yt-dlp flat-playlist.");
        const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
        if (ytDlpResult && ytDlpResult.success) {
          return res.json(ytDlpResult);
        }
      }

      // 1. Primary for Facebook: btch.fbdown
      if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch") || lowerUrl.includes("fb.com")) {
        try {
          const result = await btch.fbdown(trimmedUrl);
          if (result && result.status && (result.Normal_video || result.HD)) {
            const videoUrl = result.HD || result.Normal_video;
            console.log("Extraction via btch.fbdown succeeded!");
            return res.json({
              success: true,
              title: "Facebook Video",
              url: videoUrl,
              mediaType: "video",
              qualities: getFallbackQualities(videoUrl, "video"),
              media: [{ type: "video", url: videoUrl }]
            });
          }
        } catch (e) {
          // Ignore
        }
      }

      // 1. Primary for YouTube: @vreden/youtube_scraper
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        const vredenResult = await extractWithVreden(trimmedUrl);
        if (vredenResult && vredenResult.success) {
          console.log("Extraction via @vreden/youtube_scraper succeeded!");
          return res.json(vredenResult);
        }
      }

      // 1. Primary: yt-dlp_linux
      const ytDlpResult = await extractWithYtDlp(trimmedUrl);
      if (ytDlpResult && ytDlpResult.success) {
        console.log("Extraction via yt-dlp succeeded!");
        return res.json(ytDlpResult);
      }

      // 2. Cobalt API instances (Best for Vercel/Bolt)
      console.log("Trying Cobalt API instances as fallback...");
      const cobaltResult = await extractWithCobalt(trimmedUrl);
      if (cobaltResult && cobaltResult.success) {
        console.log("Extraction via Cobalt succeeded!");
        return res.json(cobaltResult);
      }

      // 3. Fallbacks for specific platforms
      if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch") || lowerUrl.includes("fb.com")) {
        try {
          const result = await btch.fbdown(trimmedUrl);
          if (result && result.status && (result.Normal_video || result.HD)) {
            const videoUrl = result.HD || result.Normal_video;
            return res.json({
              success: true,
              title: "Facebook Video",
              url: videoUrl,
              mediaType: "video",
              qualities: getFallbackQualities(videoUrl, "video"),
              media: [{ type: "video", url: videoUrl }]
            });
          }
        } catch (e) {
          // Ignore
        }
      }

      if (lowerUrl.includes("tiktok.com")) {
        try {
          const result = await btch.ttdl(trimmedUrl);
          if (result && result.status && result.video && result.video.length > 0) {
            const videoUrl = result.video[0];
            return res.json({
              success: true,
              title: result.title || "TikTok Video",
              thumbnail: result.thumbnail,
              url: videoUrl,
              mediaType: "video",
              qualities: getFallbackQualities(videoUrl, "video"),
              media: [{ type: "video", url: videoUrl, thumbnail: result.thumbnail }]
            });
          }
        } catch (e) {
          console.log("TikTok fallback scraper failed (falling back).");
        }
      }
      
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        try {
          const result = await btch.youtube(trimmedUrl);
          if (result && result.status && result.mp4) {
            return res.json({
              success: true,
              title: result.title || "YouTube Video",
              thumbnail: result.thumbnail,
              url: result.mp4,
              mediaType: "video",
              qualities: getFallbackQualities(result.mp4, "video"),
              media: [{ type: "video", url: result.mp4, thumbnail: result.thumbnail }]
            });
          }
        } catch (e) {
          console.log("YouTube fallback scraper failed (falling back).");
        }
      }

      // 3. AI / Cheerio fallback
      console.log("No specialized or yt-dlp scraper succeeded. Running last-resort AI/Cheerio fallback...");
      const aiResult = await extractWithAI(trimmedUrl, isProfile);
      if (aiResult && aiResult.success) {
        console.log("Last-resort extraction succeeded!");
        return res.json(aiResult);
      }

      return res.status(400).json({ 
         success: false, 
         message: "Extraction failed: The media content could not be retrieved. Please verify the link is public and try again." 
       });
          
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
      const result = await vredenYtmp4(videoUrl, quality);
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
      pipeUrlStream(fileUrl as string, res, customFilename as string, inline);
    }
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
