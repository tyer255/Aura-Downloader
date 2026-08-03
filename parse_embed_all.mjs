async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/p/${shortcode}/embed/`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  const html = await res.text();
  console.log("HTML total length:", html.length);

  // Search for any JSON string inside script tags
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  let scriptIdx = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptIdx++;
    const s = match[1];
    
    // Look for all http/https URLs in s that contain .jpg, .jpeg, .png, .mp4, scontent, cdninstagram, fbcdn
    const matches = [...s.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]+/gi)]
      .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''))
      .filter(u => !u.includes('static.cdninstagram.com') && !u.includes('rsrc.php'));

    if (matches.length > 0) {
      console.log(`Script #${scriptIdx} has ${matches.length} non-static media URLs!`);
      const unique = [...new Set(matches)];
      unique.forEach((u, i) => console.log(`   [${i}]: ${u.substring(0, 160)}`));
    }
  }
}

run();
