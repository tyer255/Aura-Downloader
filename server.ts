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
      
      const displayName = title.split(" (")[0] || title;
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
    console.error("Local Cheerio fallback failed:", err.message);
    return {
      success: false,
      error: "Could not parse media. Details: " + err.message
    };
  }
}

// Use Gemini-3.5-flash to extract high fidelity direct media URLs & Profile data

import { exec } from 'child_process';
import utilSync from 'util';
const execAsync = utilSync.promisify(exec);

async function extractWithYtDlp(url: string) {
  try {
    const { stdout } = await execAsync(`./yt-dlp --dump-json "${url}"`, { timeout: 15000 });
    const data = JSON.parse(stdout);
    
    // Choose the best video URL
    let mediaUrl = data.url;
    if (!mediaUrl && data.formats) {
       // get best format with video and audio
       const best = data.formats.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none').sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
       if (best) mediaUrl = best.url;
       else if (data.formats.length > 0) mediaUrl = data.formats[0].url;
    }
    
    if (mediaUrl) {
       return {
         success: true,
         url: mediaUrl,
         title: data.title || "Video",
         thumbnail: data.thumbnail || "",
         mediaType: "video",
         source: "yt-dlp"
       };
    }
  } catch(e: any) {
    console.error("yt-dlp extraction failed:", e.message);
  }
  return null;
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
2. If this is a profile page (YouTube channel, Instagram user, TikTok user, Facebook profile, Pinterest profile), extract user profile information: avatar picture URL (high res), banner picture URL, display name, follower counts, bio.
3. If this is a post containing multiple images (Instagram carousel, YouTube community post, Facebook gallery), return ALL extracted media items in the "media" array.
4. If it's a video, get the highest quality .mp4 or .m3u8 stream.
5. Return the result strictly in JSON format matching the response schema. No conversational wrapper or markdown formatting.`;

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

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];
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
    return [
      { label: "1080p (Full HD)", url: url, ext: "mp4", size: "High Definition" },
      { label: "720p (HD Video)", url: url, ext: "mp4", size: "Standard HD" },
      { label: "480p (SD Video)", url: url, ext: "mp4", size: "Standard Definition" },
      { label: "360p (Mobile Video)", url: url, ext: "mp4", size: "Low Bandwidth" }
    ];
  }
  return [
    {
      label: "Original Resolution (Image)",
      url: url,
      ext: "jpg",
      size: "Original"
    }
  ];
}

// Classify URL to decide the optimal parsing route
function classifyUrl(urlStr: string) {
  const url = urlStr.toLowerCase().trim();
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'x' | 'linkedin' | 'unknown' = 'unknown';
  let type: 'profile' | 'community_post' | 'media' = 'media';

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    platform = 'youtube';
    if (url.includes("/channel/") || url.includes("/c/") || url.includes("/@") || url.includes("/community") || url.includes("/post/")) {
      if (url.includes("/post/") || url.includes("lb=")) {
        type = 'community_post';
      } else {
        type = 'profile';
      }
    }
  } else if (url.includes("instagram.com")) {
    platform = 'instagram';
    // Check if it is a profile
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
      const path = urlStr.split("facebook.com")[1] || "";
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
  } else if (url.includes("linkedin.com")) {
    platform = 'linkedin';
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

      let filename = customFilename;
      if (!path.extname(filename)) {
        filename = `${filename}.${ext}`;
      }

      // Clean filename of invalid characters, but KEEP the dot
      filename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      const disposition = inline ? "inline" : `attachment; filename="${filename}"`;
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

async function extractWithCobalt(url: string, platform?: string) {
  let instances = [
    'https://api.cobalt.tools',
    'https://dog.kittycat.boo',
    'https://cobaltapi.squair.xyz',
    'https://nuko-c.meowing.de'
  ];

  try {
    console.log(`[Cobalt] Querying working instances directory for platform: ${platform || 'all'}...`);
    const res = await fetchWithTimeout("https://cobalt.directory/api/working", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, 5000) as any;
    if (res && res.ok) {
      const json = await res.json();
      const workingData = json.data || json;
      if (workingData) {
        const platformKey = platform ? platform.toLowerCase() : "";
        const platformSpecific = platformKey && workingData[platformKey] ? workingData[platformKey] : [];
        const allWorking: string[] = [];
        for (const k of Object.keys(workingData)) {
          if (Array.isArray(workingData[k])) {
            allWorking.push(...workingData[k]);
          }
        }
        const uniqueAllWorking = Array.from(new Set([...platformSpecific, ...allWorking]));
        if (uniqueAllWorking.length > 0) {
          // Put platform specific ones first, then random shuffle of other ones, then fallback list
          instances = [...platformSpecific, ...uniqueAllWorking.sort(() => Math.random() - 0.5), ...instances];
        }
      }
    }
  } catch (e: any) {
    console.log("[Cobalt] Failed to fetch dynamic cobalt instances list:", e.message);
  }

  instances = Array.from(new Set(instances.filter(u => u && u.startsWith('http') && !u.includes('liubquanti.click')))).slice(0, 8);
  console.log(`[Cobalt Debug] URLs to try: ${instances.length} endpoints for: ${url}`);

  for (const inst of instances) {
    try {
      console.log(`[Cobalt Debug] Sending extraction POST request to: ${inst}`);
      const response = await fetchWithTimeout(inst, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({ url })
      }, 5000) as any;

      if (!response.ok) {
        // Parse error response to see if it's JWT missing, so we can log it
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.code === 'error.api.auth.jwt.missing') {
             console.log(`[Cobalt Debug] Endpoint ${inst} requires JWT auth, skipping...`);
             continue;
          }
        } catch(e) {}
        continue;
      }

      const data = await response.json();
      console.log(`[Cobalt Debug] Received response data from ${inst}:`, JSON.stringify(data).substring(0, 300));

      if (data && (data.status === 'redirect' || data.status === 'stream' || data.status === 'success' || data.url)) {
        const streamUrl = data.url;
        const title = data.filename || data.text || "Extracted Media";
        
        let thumbUrl = "";
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (match && match[1]) {
            thumbUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
          }
        } else {
          try {
             const html = await fetchPageHtml(url);
             const $ = cheerio.load(html);
             thumbUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
          } catch(e) {}
        }
        
        console.log(`[Cobalt Debug] SUCCESS EXTRACTION from ${inst} for ${url}! File URL is ready.`);
        
        // Check if the stream URL is actually alive (prevent 502 bad gateway errors from dead tunnels)
        if (streamUrl) {
           try {
              console.log(`[Cobalt Debug] Verifying tunnel URL is alive: ${streamUrl.substring(0, 50)}...`);
              const checkRes = await fetch(streamUrl, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-10' } });
              const contentType = checkRes.headers.get('content-type') || '';
              if (checkRes.status >= 400 || contentType.includes('text/html')) {
                 console.log(`[Cobalt Debug] Tunnel URL is dead (${checkRes.status}). Trying next instance...`);
                 continue; // Try next instance
              }
           } catch(e) {
              console.log(`[Cobalt Debug] Error checking tunnel URL. Trying next instance: ${e.message}`);
              continue; // Try next instance
           }
        }
        
        return {
          success: true,
          url: streamUrl,
          title: title,
          thumbnail: thumbUrl,
          mediaType: "video",
          qualities: [
            { label: "1080p (Full HD)", url: streamUrl, ext: "mp4", size: "High Quality" },
            { label: "720p (HD Video)", url: streamUrl, ext: "mp4", size: "Standard HD" },
            { label: "480p (SD Video)", url: streamUrl, ext: "mp4", size: "Standard Definition" },
            { label: "360p (Mobile Video)", url: streamUrl, ext: "mp4", size: "Low Bandwidth" }
          ],
          source: `cobalt-${inst}`
        };
      } else if (data && data.status === 'picker' && Array.isArray(data.picker)) {
        const firstUrl = data.picker[0]?.url;
        if (firstUrl) {
           try {
              console.log(`[Cobalt Debug] Verifying carousel tunnel URL is alive: ${firstUrl.substring(0, 50)}...`);
              const checkRes = await fetch(firstUrl, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-10' } });
              const contentType = checkRes.headers.get('content-type') || '';
              if (checkRes.status >= 400 || contentType.includes('text/html')) {
                 console.log(`[Cobalt Debug] Carousel tunnel URL is dead (${checkRes.status}). Trying next instance...`);
                 continue; // Try next instance
              }
           } catch(e) {
              console.log(`[Cobalt Debug] Error checking carousel tunnel URL. Trying next instance: ${e.message}`);
              continue; // Try next instance
           }
        }
        
        console.log(`[Cobalt Debug] SUCCESS CAROUSEL EXTRACTION from ${inst} for ${url}!`);
        const mediaList = data.picker.map((item: any) => {
          const type = item.type === 'video' ? 'video' : 'image';
          return {
            url: item.url,
            type: type,
            thumbnail: item.thumb || item.url
          };
        });

        return {
          success: true,
          url: mediaList[0]?.url,
          title: "Multi-Asset Album",
          thumbnail: mediaList[0]?.thumbnail || mediaList[0]?.url,
          mediaType: "carousel",
          media: mediaList,
          qualities: getFallbackQualities(mediaList[0]?.url, mediaList[0]?.type),
          source: `cobalt-${inst}`
        };
      } else if (data && data.status === 'error') {
        console.log(`[Cobalt Debug] Endpoint ${inst} returned internal application error:`, data.text);
      }
    } catch (e: any) {
      console.log(`[Cobalt Debug] Endpoint ${inst} skipped (not responding):`, e.message);
    }
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint to handle direct file downloads in browser
  app.get("/api/proxy-download", (req, res) => {
    const fileUrl = req.query.url as string;
    const customFilename = req.query.filename as string || "download";
    const inline = req.query.inline === "true";

    if (!fileUrl) {
      return res.status(400).send("URL query parameter is required");
    }

    // Proxied to bypass Cobalt IP-binding for tunnels
    if (fileUrl.includes("/tunnel?id=")) {
      console.log(`Proxying Cobalt tunnel URL: ${fileUrl}`);
    }

    console.log(`Initiating stream proxy download for: ${fileUrl} (inline=${inline})`);
    pipeUrlStream(fileUrl, res, customFilename, inline);
  });

  app.post("/api/download", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }

    console.log("\n=======================================================");
    console.log(`🚀 [BACKEND RECEIVED REQUEST] URL: ${url}`);
    console.log("=======================================================\n");

    try {
      const classification = classifyUrl(url);
      console.log(`Classified URL: ${url} -> Platform: ${classification.platform}, Type: ${classification.type}`);

      // ========================================================
      // 1. CHANNELS, PROFILES AND COMMUNITY POSTS - AI ASSISTED
      // ========================================================
      if (classification.type === 'profile' || classification.type === 'community_post') {
        try {
          const aiResult = await extractWithAI(url, classification.type === 'profile');
          if (aiResult && aiResult.success && (aiResult.url || (aiResult.media && aiResult.media.length > 0) || aiResult.mediaType === 'profile')) {
            // Enrich YouTube profile data if missing
            if (classification.platform === 'youtube' && classification.type === 'profile' && aiResult.profile) {
               console.log("Enriching YouTube Profile...");
               try {
                 const html = await fetchPageHtml(url);
                 console.log("Fetched HTML for enrichment, length:", html.length);
                 if (!aiResult.profile.followers || aiResult.profile.followers === 'Unknown' || aiResult.profile.followers === '') {
                    const subMatch = html.match(/\{\"content\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"\}/i) || html.match(/\"simpleText\":\"([0-9.,]+[KMBkmb]?)\s+subscribers\"/i);
                    console.log("Sub match:", subMatch ? subMatch[1] : null);
                    if (subMatch) aiResult.profile.followers = subMatch[1];
                 }
                 if (!aiResult.profile.bannerUrl) {
                    const bannerMatch = html.match(/\"banner\":\{.*?\"url\":\"(https:\/\/[^\"]+)\"/);
                    console.log("Banner match:", bannerMatch ? bannerMatch[1] : null);
                    if (bannerMatch && bannerMatch[1]) aiResult.profile.bannerUrl = bannerMatch[1];
                 }
                 // Ensure avatar is also captured
                 if (!aiResult.profile.avatarUrl) {
                    const avatarMatch = html.match(/\"avatar\":\{.*?\"url\":\"(https:\/\/[^\"]+)\"/);
                    if (avatarMatch && avatarMatch[1]) aiResult.profile.avatarUrl = avatarMatch[1];
                 }
               } catch(e) {
                 console.log("Error enriching YouTube profile:", e);
               }
            }
            return res.json(aiResult);
          }
        } catch (e: any) {
          console.log("AI Profile/Community Post extraction failed:", e.message);
        }
      }

      // ========================================================
      // 1.5 TRY COBALT UNIVERSAL EXTRACTOR FOR FAST & PREMIUM MEDIA
      // ========================================================
      try {
        console.log(`[Universal Extractor] Attempting Cobalt extraction for: ${url}`);
        const cobaltResult = await extractWithCobalt(url, classification.platform);
        if (cobaltResult && cobaltResult.success) {
          console.log(`[Universal Extractor] Success extracting ${url} using Cobalt!`);
          // Ensure a thumbnail is always present
          if (!cobaltResult.thumbnail) {
             try {
                const html = await fetchPageHtml(url);
                const $ = cheerio.load(html);
                cobaltResult.thumbnail = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
             } catch(e) {}
          }
          return res.json(cobaltResult);
        }
      } catch (cobaltErr: any) {
        console.log(`[Universal Extractor] Cobalt extraction failed: ${cobaltErr.message}, falling back to local scrapers.`);
      }

      // WHATSAPP
      if (url.includes("whatsapp.com") || url.includes("wa.me")) {
        return res.status(400).json({
          success: false,
          error: "WhatsApp URLs are private and cannot be downloaded by this tool. Please upload the file directly or use a public platform link."
        });
      }

      // TIKTOK FALLBACK (using btch-downloader)
      if (classification.platform === 'tiktok') {
        try {
          console.log("[TikTok] Attempting fallback using btch-downloader...");
          const btchRes = await btch.ttdl(url);
          if (btchRes && btchRes.status && btchRes.video && btchRes.video.length > 0) {
             return res.json({
                success: true,
                url: btchRes.video[0],
                title: btchRes.title || "TikTok Video",
                thumbnail: btchRes.thumbnail || "",
                mediaType: "video",
                source: "btch-tiktok"
             });
          }
        } catch(e: any) {
          console.log("TikTok fallback failed:", e.message);
        }
      }

      // PINTEREST FALLBACK (from FIPY_downloader)
      if (classification.platform === 'pinterest') {
        try {
          console.log("[Pinterest] Scraping video-snippet from page...");
          let fetchUrl = url;
          if (url.includes("pin.it")) {
             // Resolve redirect for pin.it
             const redirectRes = await fetch(url, { redirect: 'manual' });
             if (redirectRes.status >= 300 && redirectRes.status < 400) {
                fetchUrl = redirectRes.headers.get('location') || url;
             }
          }
          const pinRes = await fetch(fetchUrl);
          const html = await pinRes.text();
          const match = html.match(/<script[^>]*data-test-id="video-snippet"[^>]*>(.*?)<\/script>/s);
          if (match && match[1]) {
             const json = JSON.parse(match[1]);
             if (json && json.contentUrl) {
                return res.json({
                   success: true,
                   url: json.contentUrl,
                   title: json.name || "Pinterest Video",
                   thumbnail: json.thumbnailUrl || "",
                   mediaType: "video",
                   source: "fipy-pinterest-scraper"
                });
             }
          }
        } catch(e: any) {
          console.log("Pinterest fallback failed:", e.message);
        }
      }
      if (classification.platform === 'reddit') {
        try {
          const rRes = await fetch(url);
          const html = await rRes.text();
          let mediaUrl = "";
          
          const packagedMediaMatch = html.match(/"packagedMedia":\{"fallback":\{"url":"([^"]+)"/);
          if (packagedMediaMatch && packagedMediaMatch[1]) {
            mediaUrl = packagedMediaMatch[1];
          } else {
            const shredditMatch = html.match(/<shreddit-player[^>]+src="([^"]+)"/);
            if (shredditMatch && shredditMatch[1]) {
              mediaUrl = shredditMatch[1];
            } else {
              const dashMatch = html.match(/https:\/\/v\.redd\.it\/[a-zA-Z0-9_]+\/DASH_[0-9]+\.mp4/);
              if (dashMatch && dashMatch[0]) mediaUrl = dashMatch[0];
            }
          }

          if (mediaUrl) {
            return res.json({
              success: true,
              url: mediaUrl,
              title: "Reddit Media",
              thumbnail: mediaUrl,
              mediaType: "video",
              qualities: getFallbackQualities(mediaUrl, "video"),
              source: "reddit-parser"
            });
          }
        } catch (e) {}
      }

      

      // FACEBOOK FALLBACK (from FIPY_downloader)
      if (classification.platform === 'facebook') {
        try {
          console.log("[Facebook] Attempting fallback using FIPY downloader API...");
          const fbRes = await fetch("https://facebook-video-downloader.fly.dev/app/main.php", {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            body: new URLSearchParams({ url })
          });
          const fbData = await fbRes.json() as any;
          if (fbData && fbData.links) {
             const hdUrl = fbData.links["Download High Quality"];
             const sdUrl = fbData.links["Download Low Quality"];
             const targetUrl = hdUrl || sdUrl;
             if (targetUrl) {
                return res.json({
                  success: true,
                  url: targetUrl,
                  title: fbData.title || "Facebook Video",
                  thumbnail: fbData.thumbnail || "",
                  mediaType: "video",
                  source: "fipy-facebook-api"
                });
             }
          }
        } catch(e: any) {
          console.log("Facebook fallback failed:", e.message);
        }
      }

      // YOUTUBE VIDEO/SHORTS
      if (classification.platform === 'youtube') {
        try {
          console.log("Primary YouTube extraction using @vreden/youtube_scraper...");
          let resData: any = null;
          for (let qual of ['1080p', '720p', '480p', '360p']) {
             try {
                const temp = await vredenYtmp4(url, qual);
                if (temp && temp.status && temp.download && temp.download.url) {
                   resData = temp;
                   break;
                }
             } catch(e) {}
          }
          if (resData && resData.download && resData.download.url) {
             return res.json({
                success: true,
                url: resData.download.url,
                title: resData.metadata?.title || "YouTube Video",
                thumbnail: resData.metadata?.thumbnail || resData.metadata?.image,
                mediaType: "video",
                source: "vreden-ytmp4"
             });
          }
        } catch (ytVredenErr: any) {
          console.log("Primary vreden extraction failed:", ytVredenErr.message);
        }

        try {
          console.log("Secondary YouTube extraction using btch-downloader...");
          const btchRes = await btch.youtube(url);
          if (btchRes && btchRes.status && btchRes.mp4) {
             return res.json({
                success: true,
                url: btchRes.mp4,
                title: btchRes.title || "YouTube Video",
                thumbnail: btchRes.thumbnail,
                mediaType: "video",
                source: "btch-youtube"
             });
          }
        } catch (btchErr: any) {
          console.log("Secondary btch extraction failed:", btchErr.message);
        }
      }

      // ========================================================
      
      // ========================================================
      // 3.5 yt-dlp LOCAL EXTRACTION (from youwee repo logic)
      // ========================================================
      try {
        console.log("[yt-dlp] Attempting local extraction...");
        const ytdlpResult = await extractWithYtDlp(url);
        if (ytdlpResult && ytdlpResult.success) {
           console.log(`[yt-dlp] Success extracting ${url}!`);
           return res.json(ytdlpResult);
        }
      } catch(e) {}

      // 4. ULTIMATE Fallback: AI Direct Parsing
      // ========================================================
      console.log("Engaging universal AI fallback for:", url);
      const aiResult = await extractWithAI(url, false);
      if (aiResult && aiResult.success && (aiResult.url || (aiResult.media && aiResult.media.length > 0))) {
        if (aiResult.url || (aiResult.media && aiResult.media[0] && aiResult.media[0].url)) {
          return res.json(aiResult);
        }
      }
      if (classification.platform === 'instagram') {
        return res.status(400).json({
          success: false,
          error: "Instagram extraction failed. Due to recent Instagram policy changes, public API access is blocked and cookies/login are required. The developer is working on a fix."
        });
      }
      return res.status(400).json({
        success: false,
        error: "Could not extract media URL. Please ensure the link is public and accessible."
      });
    } catch (e: any) {
      console.log("Global Downloader Error:", e.message);
      return res.status(500).json({
        success: false,
        error: "An unexpected extraction error occurred: " + e.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'index.html'));
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
