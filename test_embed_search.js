import fetch from 'node-fetch';

async function searchEmbedHtml(shortcode) {
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  const html = await res.text();
  console.log("HTML len:", html.length);

  // Search for keywords
  const keywords = ["carousel_media", "edge_sidecar_to_children", "sidecar_media", "EmbeddedMediaImage", "display_url", "video_url", "src_cdn", "scontent"];
  keywords.forEach(kw => {
    const count = (html.match(new RegExp(kw, 'g')) || []).length;
    console.log(`Keyword '${kw}': count = ${count}`);
  });

  // Extract all cdninstagram / fbcdn image URLs
  const cdnImageMatches = [...html.matchAll(/(https:\\\/\\\/[^\s"']*(?:cdninstagram|fbcdn)[^\s"']*)/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));
  console.log("Found CDN image matches count:", cdnImageMatches.length);

  // Deduplicate base URLs
  const uniqueBases = new Map();
  cdnImageMatches.forEach(u => {
    const base = u.split('?')[0];
    if (!uniqueBases.has(base) && (u.includes('.jpg') || u.includes('.png') || u.includes('.mp4') || u.includes('.heic') || u.includes('.webp'))) {
      uniqueBases.set(base, u);
    }
  });

  console.log("Unique media bases count:", uniqueBases.size);
  let idx = 1;
  for (const [base, fullUrl] of uniqueBases) {
    console.log(`  [Match ${idx++}]: ${fullUrl.substring(0, 100)}...`);
  }
}

searchEmbedHtml("C3x-Z2_S0gY");
