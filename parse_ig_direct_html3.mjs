async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/html, */*"
    }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Text length:", text.length);

  try {
    const json = JSON.parse(text);
    console.log("JSON keys:", Object.keys(json));
    console.log("JSON content:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log("Not JSON. Searching text for script or JSON...");
    const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
    let match;
    let idx = 0;
    while ((match = scriptRegex.exec(text)) !== null) {
      const s = match[1];
      if (s.includes('scontent') || s.includes('cdninstagram') || s.includes('display_url') || s.includes('video_url') || s.includes('thumbnail_url')) {
        idx++;
        console.log(`Script #${idx} (len ${s.length}):`, s.substring(0, 300));
      }
    }
  }
}

run();
