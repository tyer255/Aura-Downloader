import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import youtubedl from "youtube-dl-exec";
import ytdl from "@distube/ytdl-core";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
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
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 4000
  } as any);
  if (!response.ok) {
    throw new Error(`Webpage fetch failed with status ${response.status}`);
  }
  return await response.text();
}

// High speed timeout wrapper to keep the backend ultra responsive
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

// Fetch webpage using Puppeteer to bypass JS-heavy blocks
async function fetchPageWithPuppeteer(url: string): Promise<string> {
  console.log("Opening Puppeteer for URL:", url);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Speed up loading by intercepting and blocking heavy assets (CSS, images, fonts, media, track files)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'other', 'manifest', 'texttrack'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });
    
    // Reduce static timeout significantly because assets are blocked and the JS DOM is loaded almost instantly
    await new Promise(r => setTimeout(r, 200));
    
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
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
      console.log("Direct fetch HTML seems too short, blocked, or redirected to login. Falling back to Puppeteer...");
      htmlContent = await fetchPageWithPuppeteer(crawlUrl);
    }
  } catch (err: any) {
    // If blocked, run Puppeteer
    console.log("Direct fetch failed, falling back to Puppeteer:", err.message);
    try {
      let crawlUrl = url;
      if (url.toLowerCase().includes("instagram.com") && !isProfile) {
        const shortcode = getInstagramShortcode(url);
        if (shortcode) crawlUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
      }
      htmlContent = await fetchPageWithPuppeteer(crawlUrl);
    } catch (puppeteerErr: any) {
      console.log("Puppeteer fetch failed too:", puppeteerErr.message);
    }
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

// Helpers to extract qualities and file sizes from yt-dlp metadata
function getFilesizeStr(f: any): string {
  if (f.filesize) {
    return `${(f.filesize / (1024 * 1024)).toFixed(1)} MB`;
  } else if (f.filesize_approx) {
    return `~${(f.filesize_approx / (1024 * 1024)).toFixed(1)} MB`;
  }
  return "";
}

function extractQualitiesFromYtDlp(output: any): any[] {
  if (!output || !output.formats) return [];
  
  const qualities: any[] = [];
  
  // Sort formats by height descending
  const sortedFormats = [...output.formats].sort((a: any, b: any) => {
    const hA = a.height || 0;
    const hB = b.height || 0;
    return hB - hA;
  });

  // Find a solid stream with audio as a fallback url
  const bestWithAudio = output.formats.find((f: any) => f.url && f.acodec && f.acodec !== 'none' && f.acodec !== null && f.vcodec && f.vcodec !== 'none') || output;
  const fallbackUrl = bestWithAudio.url || output.url;

  for (const f of sortedFormats) {
    if (!f.url) continue;
    if (f.vcodec === 'none' || f.vcodec === null) continue;
    
    const height = f.height || 0;
    if (height === 0) continue;
    
    const hasAudio = f.acodec && f.acodec !== 'none' && f.acodec !== null;
    
    let label = `${height}p`;
    if (f.fps) {
      label += ` ${f.fps}fps`;
    }
    if (!hasAudio) {
      label += " (No Audio)";
    } else {
      label += " (with Audio)";
    }
    
    const existing = qualities.find(q => q.height === height);
    if (existing) {
      if (!existing.hasAudio && hasAudio) {
        const idx = qualities.indexOf(existing);
        qualities[idx] = {
          label,
          url: f.url,
          ext: f.ext || "mp4",
          size: getFilesizeStr(f),
          height,
          hasAudio
        };
      }
      continue;
    }
    
    qualities.push({
      label,
      url: f.url,
      ext: f.ext || "mp4",
      size: getFilesizeStr(f),
      height,
      hasAudio
    });
  }

  // Ensure standard 1080p, 720p, 480p, 360p are ALWAYS visible
  const standardHeights = [
    { target: 1080, label: "1080p (Full HD)", size: "High Definition" },
    { target: 720, label: "720p (HD Video)", size: "Standard HD" },
    { target: 480, label: "480p (SD Video)", size: "Standard Definition" },
    { target: 360, label: "360p (Mobile Video)", size: "Low Bandwidth" }
  ];

  const finalQualities: any[] = [];
  
  // First, map any found qualities that match our target heights or are close
  for (const std of standardHeights) {
    const matched = qualities.find(q => q.height === std.target && q.hasAudio) || 
                    qualities.find(q => q.height === std.target) ||
                    qualities.find(q => Math.abs(q.height - std.target) < 100 && q.hasAudio);
    
    if (matched) {
      finalQualities.push({
        label: `${std.target}p (${matched.hasAudio ? "with Audio" : "Original Stream"})`,
        url: matched.url,
        ext: matched.ext,
        size: matched.size || std.size
      });
    } else if (fallbackUrl) {
      // If missing, add fallback pointing to best stream with audio!
      finalQualities.push({
        label: std.label,
        url: fallbackUrl,
        ext: "mp4",
        size: std.size
      });
    }
  }

  // Add any other unique qualities not added yet (e.g. 1440p, 2160p)
  for (const q of qualities) {
    const isClose = standardHeights.some(std => Math.abs(q.height - std.target) < 100);
    if (!isClose && q.height > 1080) {
      finalQualities.unshift({
        label: `${q.height}p (Ultra HD)`,
        url: q.url,
        ext: q.ext,
        size: q.size || "Best Quality"
      });
    }
  }

  return finalQualities.slice(0, 8);
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
  let platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'unknown' = 'unknown';
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

async function extractWithCobalt(url: string) {
  let instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.pewpew.nyc',
    'https://co.wuk.sh',
    'https://cobalt.tu.fo',
    'https://cobalt.qewertyy.dev'
  ];

  try {
    console.log("[Cobalt] Querying working instances directory...");
    const res = await withTimeout(fetch('https://cobalt.directory/api/working'), 5000) as any;
    if (res && res.ok) {
      const data = await res.json();
      if (data && data.data) {
        const list: string[] = [];
        for (const platform of Object.keys(data.data)) {
          if (Array.isArray(data.data[platform])) {
            list.push(...data.data[platform]);
          }
        }
        if (list.length > 0) {
          const uniqueList = Array.from(new Set(list));
          instances = [...uniqueList, ...instances];
          uniqueList.sort(() => Math.random() - 0.5);
        }
      }
    }
  } catch (e: any) {
    console.log("[Cobalt] Failed to fetch dynamic cobalt instances list:", e.message);
  }

  instances = Array.from(new Set(instances.filter(Boolean))).slice(0, 15);
  console.log(`[Cobalt Debug] URLs to try: ${instances.length} endpoints for: ${url}`);

  for (const inst of instances) {
    try {
      console.log(`[Cobalt Debug] Sending extraction POST request to: ${inst}`);
      const response = await withTimeout(fetch(inst, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: url
        })
      }), 7000) as any;

      if (!response.ok) {
        // Silently continue to next instance if one fails (many public instances now require JWT)
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
      console.log(`[Cobalt Debug] Connection failed with ${inst}:`, e.message);
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

    // Bypass proxy for Cobalt tunnel URLs to avoid Cloudflare bot blocking
    // Cobalt tunnels have CORS and Content-Disposition headers natively.
    if (fileUrl.includes("/tunnel?id=")) {
      console.log(`Redirecting Cobalt tunnel URL to avoid proxy block: ${fileUrl}`);
      return res.redirect(fileUrl);
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
        const cobaltResult = await extractWithCobalt(url);
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

      // PINTEREST PIN
      // INSTAGRAM REEL/POST/STORY
      if (classification.platform === 'instagram') {
        try {
          console.log("Engaging Fast Instagram Embed Parser for URL:", url);
          const shortcode = getInstagramShortcode(url);
          if (shortcode) {
            const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
            const embedRes = await withTimeout(fetch(embedUrl), 8000) as any;
            if (embedRes && embedRes.ok) {
              const html = await embedRes.text();
              const marker = '"contextJSON":"';
              const startIdx = html.indexOf(marker);
              if (startIdx !== -1) {
                const fromMarker = html.substring(startIdx + marker.length);
                let endIdx = 0;
                for (let i = 0; i < fromMarker.length; i++) {
                  if (fromMarker[i] === '"' && fromMarker[i-1] !== '\\') {
                    endIdx = i;
                    break;
                  }
                }
                const rawValue = fromMarker.substring(0, endIdx);
                const jsonStr = JSON.parse('"' + rawValue + '"');
                const parsed = JSON.parse(jsonStr);
                const sm = parsed?.gql_data?.shortcode_media;
                if (sm) {
                  const title = sm.title || sm.edge_media_to_caption?.edges?.[0]?.node?.text || "Instagram Post";
                  const displayUrl = sm.display_url;
                  const videoUrl = sm.video_url;
                  
                  let mediaList = [];
                  let mediaType = sm.is_video ? "video" : "image";
                  
                  if (sm.edge_sidecar_to_children && sm.edge_sidecar_to_children.edges) {
                    mediaType = "carousel";
                    sm.edge_sidecar_to_children.edges.forEach((edge: any) => {
                      const node = edge.node;
                      mediaList.push({
                        url: node.video_url || node.display_url,
                        type: node.is_video ? "video" : "image",
                        thumbnail: node.display_url
                      });
                    });
                  } else {
                    mediaList.push({
                      url: videoUrl || displayUrl,
                      type: sm.is_video ? "video" : "image",
                      thumbnail: displayUrl
                    });
                  }

                  const profile = sm.owner ? {
                    username: sm.owner.username || "instagram_user",
                    displayName: sm.owner.full_name || sm.owner.username || "",
                    avatarUrl: sm.owner.profile_pic_url || "",
                    followers: sm.owner.edge_followed_by?.count?.toLocaleString() || "Unknown",
                    postsCount: sm.edge_liked_by?.count ? `${sm.edge_liked_by.count.toLocaleString()} likes` : ""
                  } : undefined;

                  const qualities = getFallbackQualities(videoUrl || displayUrl, sm.is_video ? "video" : "image");

                  console.log("Fast Instagram Embed Extraction Succeeded!");
                  return res.json({
                    success: true,
                    url: videoUrl || displayUrl,
                    title,
                    thumbnail: displayUrl,
                    mediaType,
                    media: mediaList,
                    profile,
                    qualities,
                    source: "instagram-embed-fast"
                  });
                }
              }
            }
          }
        } catch (fastErr: any) {
          console.log("Fast Instagram Embed Extraction failed:", fastErr.message);
        }
        
        // If we reach here, it means Cobalt failed, Fast Embed failed.
        // Instagram requires login cookies now and aggressively blocks all scrapers.
        // Block removed to allow fallback
      }

      // TIKTOK VIDEO
      // FACEBOOK VIDEO
      

      // REDDIT
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
      // 3. FALLBACK TO YT-DLP FOR STREAMS (Skip for YouTube)
      // ========================================================
      if (classification.platform !== 'youtube') {
        try {
          const output = await withTimeout(youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
              'referer:google.com',
              'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            ]
          }), 15000) as any;

          let directUrl = output.url;
          const qualities = extractQualitiesFromYtDlp(output);
          if (!directUrl && qualities.length > 0) {
            directUrl = qualities[0].url;
          }

          if (directUrl) {
            return res.json({
              success: true,
              url: directUrl,
              title: output.title || "Media Download",
              thumbnail: output.thumbnail,
              mediaType: output.playlist ? "carousel" : "video",
              qualities: qualities,
              source: "yt-dlp"
            });
          }
        } catch (e) {}
      }

      // ========================================================
      // 4. ULTIMATE Fallback: AI Direct Parsing
      // ========================================================
      console.log("Engaging universal AI fallback for:", url);
      const aiResult = await extractWithAI(url, false);
      if (aiResult && aiResult.success && (aiResult.url || (aiResult.media && aiResult.media.length > 0))) {
        return res.json(aiResult);
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
