async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/html, */*"
    }
  });
  const text = await res.text();

  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  let idx = 0;
  while ((match = scriptRegex.exec(text)) !== null) {
    idx++;
    if (idx === 3) {
      const s = match[1];
      console.log("Script 3 length:", s.length);

      // Search for any occurrence of url or display or media or video or image in script 3
      const urls = [...s.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]+/gi)]
        .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));

      console.log("Found URLs in script 3 count:", urls.length);
      const unique = [...new Set(urls)];
      console.log("Unique URLs in script 3:", unique.length);
      unique.forEach((u, i) => {
        if (u.includes('scontent') || u.includes('cdninstagram') || u.includes('fbcdn') || u.includes('instagram.com')) {
          console.log(`  u[${i}]: ${u.substring(0, 150)}`);
        }
      });
    }
  }
}

run();
