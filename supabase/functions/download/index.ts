import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") throw new Error("Timeout");
    throw err;
  }
}

function cleanHTML(html: string): string {
  try {
    const $ = cheerio.load(html);
    $("script:not([type=\"application/ld+json\"])").remove();
    $("style").remove();
    $("noscript").remove();
    $("svg").remove();
    $("iframe").remove();

    let metaInfo = "";
    $("meta").each((_i: number, el: any) => {
      const name = $(el).attr("name") || $(el).attr("property");
      const content = $(el).attr("content");
      if (name && content) metaInfo += `${name}: ${content}\n`;
    });

    let ldJson = "";
    $("script[type=\"application/ld+json\"]").each((_i: number, el: any) => {
      ldJson += $(el).html() + "\n";
    });

    let links = "";
    $("img, video, source, a").each((i: number, el: any) => {
      if (i > 60) return;
      const src = $(el).attr("src") || $(el).attr("href") || $(el).attr("poster") || $(el).attr("data-src");
      const alt = $(el).attr("alt") || "";
      if (src && (src.startsWith("http") || src.includes("cdn") || src.includes("media"))) {
        links += `<${el.name} src="${src}" alt="${alt}">\n`;
      }
    });

    return `TITLE: ${$("title").text()}\nMETADATA:\n${metaInfo}\nLD_JSON:\n${ldJson}\nMEDIA_LINKS:\n${links}`.slice(0, 18000);
  } catch {
    return html.slice(0, 5000);
  }
}

function localCheerioFallback(html: string, url: string, isProfile: boolean): any {
  try {
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || $("meta[property=\"og:title\"]").attr("content") || "Social Media Post";
    const description = $("meta[property=\"og:description\"]").attr("content") || $("meta[name=\"description\"]").attr("content") || "";
    const thumbnail = $("meta[property=\"og:image\"]").attr("content") || $("meta[name=\"twitter:image\"]").attr("content") || "";
    let directUrl = $("meta[property=\"og:video\"]").attr("content") || $("meta[property=\"og:video:secure_url\"]").attr("content") || $("meta[property=\"og:video:url\"]").attr("content") || "";

    if (!directUrl) {
      $("video source").each((_i: number, el: any) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http")) { directUrl = src; return false; }
      });
    }
    if (!directUrl) {
      $("video").each((_i: number, el: any) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http")) { directUrl = src; return false; }
      });
    }
    if (!directUrl && !isProfile) directUrl = thumbnail || "";

    if (isProfile) {
      let username = "user";
      if (url.includes("@")) {
        username = "@" + url.split("@")[1].split("/")[0].split("?")[0];
      } else {
        const segments = url.split("/").filter(Boolean);
        username = segments[segments.length - 1] || "user";
      }
      const displayName = title.split(" (")[0] || title;
      return {
        success: true,
        title: displayName,
        description,
        thumbnail,
        mediaType: "profile",
        profile: { username, displayName, avatarUrl: thumbnail, bannerUrl: "", bio: description, followers: "Unknown", following: "Unknown", postsCount: "Unknown" }
      };
    }

    const mediaType = directUrl && (directUrl.includes(".mp4") || directUrl.includes("m3u8") || $("meta[property=\"og:video\"]").length > 0) ? "video" : "image";
    return {
      success: !!directUrl,
      title,
      description,
      thumbnail,
      url: directUrl,
      mediaType,
      media: directUrl ? [{ url: directUrl, type: mediaType, thumbnail }] : []
    };
  } catch (err: any) {
    return { success: false, error: "Parse error: " + err.message };
  }
}

async function extractWithAI(url: string, isProfile: boolean, htmlContent: string): Promise<any> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const condensed = cleanHTML(htmlContent || "<html><body></body></html>");

  const systemInstruction = `You are an expert Social Media scraper. Extract direct media URLs, profile info, titles, and stats from condensed HTML. Return JSON only.`;

  const responseSchema = {
    type: "object",
    properties: {
      success: { type: "boolean" },
      title: { type: "string" },
      description: { type: "string" },
      thumbnail: { type: "string" },
      url: { type: "string" },
      mediaType: { type: "string" },
      media: {
        type: "array",
        items: {
          type: "object",
          properties: { url: { type: "string" }, type: { type: "string" }, thumbnail: { type: "string" } },
          required: ["url", "type"]
        }
      },
      profile: {
        type: "object",
        properties: {
          username: { type: "string" }, displayName: { type: "string" }, avatarUrl: { type: "string" },
          bannerUrl: { type: "string" }, bio: { type: "string" }, followers: { type: "string" },
          following: { type: "string" }, postsCount: { type: "string" }
        },
        required: ["username"]
      }
    },
    required: ["success"]
  };

  for (const modelName of ["gemini-2.5-flash", "gemini-1.5-flash"]) {
    try {
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: `Analyze for URL: ${url}\n\nCONTENT:\n${condensed}` }] }],
          generation_config: {
            response_mime_type: "application/json",
            response_schema: responseSchema
          }
        })
      }, 20000);

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.trim());
          if (parsed?.success) return parsed;
        }
      }
    } catch {
      // try next model
    }
  }
  return null;
}

function getFallbackQualities(url: string, mediaType = "video") {
  if (mediaType === "video") {
    return [
      { label: "1080p (Full HD)", url, ext: "mp4", size: "High Definition" },
      { label: "720p (HD Video)", url, ext: "mp4", size: "Standard HD" },
      { label: "480p (SD Video)", url, ext: "mp4", size: "Standard Definition" },
      { label: "360p (Mobile Video)", url, ext: "mp4", size: "Low Bandwidth" }
    ];
  }
  return [{ label: "Original Resolution", url, ext: "jpg", size: "Original" }];
}

function classifyUrl(urlStr: string) {
  const url = urlStr.toLowerCase().trim();
  let platform: string = "unknown";
  let type: string = "media";

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    platform = "youtube";
    if (url.includes("/channel/") || url.includes("/c/") || url.includes("/@")) {
      type = url.includes("/post/") || url.includes("lb=") ? "community_post" : "profile";
    }
  } else if (url.includes("instagram.com")) {
    platform = "instagram";
    if (!url.includes("/p/") && !url.includes("/reel/") && !url.includes("/tv/") && !url.includes("/stories/")) {
      const path = urlStr.split("instagram.com")[1] || "";
      const segments = path.split("?")[0].split("/").filter(Boolean);
      if (segments.length === 1) type = "profile";
    }
  } else if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
    platform = "facebook";
  } else if (url.includes("tiktok.com")) {
    platform = "tiktok";
    if (!url.includes("/video/")) {
      const path = urlStr.split("tiktok.com")[1] || "";
      if (path) {
        const segments = path.split("?")[0].split("/").filter(Boolean);
        if (segments.length === 1 && segments[0].startsWith("@")) type = "profile";
      }
    }
  } else if (url.includes("reddit.com") || url.includes("redd.it")) {
    platform = "reddit";
  } else if (url.includes("pinterest.com") || url.includes("pin.it")) {
    platform = "pinterest";
  }

  return { platform, type };
}

async function extractWithCobalt(url: string): Promise<any> {
  let instances = [
    "https://api.cobalt.tools",
    "https://cobalt-api.pewpew.nyc",
    "https://cobalt.tu.fo",
    "https://cobalt.qewertyy.dev"
  ];

  try {
    const res = await fetchWithTimeout("https://cobalt.directory/api/working", {}, 4000);
    if (res.ok) {
      const data = await res.json() as any;
      if (data?.data) {
        const list: string[] = [];
        for (const platform of Object.keys(data.data)) {
          if (Array.isArray(data.data[platform])) list.push(...data.data[platform]);
        }
        if (list.length > 0) {
          const unique = Array.from(new Set(list));
          instances = [...unique.sort(() => Math.random() - 0.5), ...instances];
        }
      }
    }
  } catch { /* use defaults */ }

  instances = Array.from(new Set(instances.filter(Boolean))).slice(0, 5);

  for (const inst of instances) {
    try {
      const response = await fetchWithTimeout(inst, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: JSON.stringify({ url })
      }, 5000);

      if (!response.ok) continue;

      const data = await response.json() as any;

      if (data && (data.status === "redirect" || data.status === "stream" || data.status === "success" || data.url)) {
        const streamUrl = data.url;
        if (!streamUrl) continue;

        let thumbUrl = "";
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch?.[1]) thumbUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

        return {
          success: true,
          url: streamUrl,
          title: data.filename || data.text || "Media Download",
          thumbnail: thumbUrl,
          mediaType: "video",
          qualities: getFallbackQualities(streamUrl, "video"),
          source: `cobalt`
        };
      }

      if (data?.status === "picker" && Array.isArray(data.picker)) {
        const mediaList = data.picker.map((item: any) => ({
          url: item.url,
          type: item.type === "video" ? "video" : "image",
          thumbnail: item.thumb || item.url
        }));
        return {
          success: true,
          url: mediaList[0]?.url,
          title: "Multi-Asset Album",
          thumbnail: mediaList[0]?.thumbnail,
          mediaType: "carousel",
          media: mediaList,
          qualities: getFallbackQualities(mediaList[0]?.url, mediaList[0]?.type),
          source: "cobalt"
        };
      }
    } catch { /* try next */ }
  }
  return null;
}

async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  }, 6000);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return await response.text();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const classification = classifyUrl(url);

    // 1. Profile / community post via AI
    if (classification.type === "profile" || classification.type === "community_post") {
      try {
        let html = "";
        try { html = await fetchPageHtml(url); } catch { /* ok */ }
        const aiResult = await extractWithAI(url, classification.type === "profile", html);
        if (aiResult?.success) {
          return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        // Cheerio fallback for profiles
        if (html) {
          const fallback = localCheerioFallback(html, url, true);
          if (fallback.success) {
            return new Response(JSON.stringify(fallback), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
      } catch { /* fall through */ }
    }

    // 2. Cobalt extraction (universal)
    const cobaltResult = await extractWithCobalt(url);
    if (cobaltResult?.success) {
      if (!cobaltResult.thumbnail) {
        try {
          const html = await fetchPageHtml(url);
          const $ = cheerio.load(html);
          cobaltResult.thumbnail = $("meta[property=\"og:image\"]").attr("content") || $("meta[name=\"twitter:image\"]").attr("content") || "";
        } catch { /* ok */ }
      }
      return new Response(JSON.stringify(cobaltResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Reddit-specific fallback
    if (classification.platform === "reddit") {
      try {
        const rRes = await fetchWithTimeout(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" }
        }, 6000);
        const html = await rRes.text();
        let mediaUrl = "";
        const packagedMatch = html.match(/"packagedMedia":\{"fallback":\{"url":"([^"]+)"/);
        if (packagedMatch?.[1]) mediaUrl = packagedMatch[1];
        else {
          const dashMatch = html.match(/https:\/\/v\.redd\.it\/[a-zA-Z0-9_]+\/DASH_[0-9]+\.mp4/);
          if (dashMatch?.[0]) mediaUrl = dashMatch[0];
        }
        if (mediaUrl) {
          return new Response(JSON.stringify({
            success: true, url: mediaUrl, title: "Reddit Media", thumbnail: mediaUrl,
            mediaType: "video", qualities: getFallbackQualities(mediaUrl, "video"), source: "reddit"
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch { /* fall through */ }
    }

    // 4. HTML metadata fallback (cheerio)
    try {
      let crawlUrl = url;
      if (url.toLowerCase().includes("instagram.com")) {
        const shortcodeMatch = url.match(/(?:\/p\/|\/reel\/|\/tv\/|\/reels\/)([a-zA-Z0-9_-]{11,15})/);
        if (shortcodeMatch?.[1]) crawlUrl = `https://www.instagram.com/p/${shortcodeMatch[1]}/embed/`;
      }
      const html = await fetchPageHtml(crawlUrl);
      if (html && html.length > 2000) {
        const fallback = localCheerioFallback(html, url, false);
        if (fallback.success && fallback.url) {
          return new Response(JSON.stringify(fallback), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        // 5. AI extraction as last resort
        const aiResult = await extractWithAI(url, false, html);
        if (aiResult?.success && (aiResult.url || aiResult.media?.length > 0)) {
          return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
    } catch { /* fall through */ }

    // Platform-specific error for Instagram
    if (classification.platform === "instagram") {
      return new Response(JSON.stringify({
        success: false,
        error: "Instagram extraction failed. Instagram has restricted public access. Please ensure the post is public and try again."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: "Could not extract media. Please ensure the link is public and accessible."
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: "Server error: " + err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
