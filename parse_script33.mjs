async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/p/${shortcode}/embed/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();

  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  let scriptIdx = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptIdx++;
    if (scriptIdx === 33) {
      const s = match[1];
      console.log("Script 33 length:", s.length);
      console.log("Snippet:", s.substring(0, 1000));

      // Search for any occurrence of scontent, fbcdn, display, video, image, url
      const urls = [...s.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]+/gi)]
        .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));
      console.log("All URLs in script 33:", urls.length);
      const unique = [...new Set(urls)];
      unique.forEach((u, i) => console.log(`  u[${i}]: ${u}`));
    }
  }
}

run();
