async function findMediaInEmbed(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  console.log(`\nTesting findMediaInEmbed for ${shortcode}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();
  console.log("HTML length:", html.length);

  const foundMedia = [];
  const seenUrls = new Set();

  function add(type, rawUrl, thumb) {
    if (!rawUrl) return;
    const cleanUrl = rawUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, '');
    const cleanThumb = thumb ? thumb.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, '') : cleanUrl;
    if (!cleanUrl.startsWith('http')) return;
    const key = cleanUrl.split('?')[0];
    if (seenUrls.has(key)) return;
    seenUrls.add(key);
    foundMedia.push({ type, url: cleanUrl, thumbnail: cleanThumb });
  }

  // 1. Scan for video_url matches
  const videoMatches = [...html.matchAll(/"video_url"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
  videoMatches.forEach(v => add("video", v));

  // 2. Scan for display_url matches
  const displayMatches = [...html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
  displayMatches.forEach(d => add("image", d));

  // 3. Scan for candidates inside image_versions2
  const candidateMatches = [...html.matchAll(/"candidates"\s*:\s*(\[[^\]]+\])/g)];
  for (const cm of candidateMatches) {
    try {
      const candidates = JSON.parse(cm[1]);
      if (Array.isArray(candidates) && candidates.length > 0) {
        add("image", candidates[0].url);
      }
    } catch (e) {}
  }

  console.log("Extracted media count:", foundMedia.length);
  foundMedia.forEach((m, i) => console.log(`  [${i}]: type=${m.type}, url=${m.url.substring(0, 100)}`));
}

async function run() {
  await findMediaInEmbed("DB1D7rwyF9H");
  await findMediaInEmbed("C9hV0C6y_nZ");
}

run();
