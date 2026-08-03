async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();
  console.log("Desktop UA HTML length:", html.length);

  // Search for any script tag containing JSON
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  let idx = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    idx++;
    const s = match[1];
    if (s.includes('scontent') || s.includes('cdninstagram') || s.includes('display_url') || s.includes('video_url') || s.includes('graphql') || s.includes('Caption')) {
      console.log(`Script #${idx} (len ${s.length}):`, s.substring(0, 300));
    }
  }
}

run();
