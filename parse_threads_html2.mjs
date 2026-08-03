async function run() {
  const url = "https://www.threads.net/t/DB1D7rwyF9H";
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();

  // Find all scontent or cdninstagram or fbcdn URLs
  const cdnUrls = [...html.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]*(?:scontent|cdninstagram|fbcdn)[^\s"'<>\\)]+/gi)]
    .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));

  console.log("Found CDN URLs count:", cdnUrls.length);
  const unique = [...new Set(cdnUrls)];
  console.log("Unique CDN URLs count:", unique.length);
  unique.forEach((u, i) => console.log(`  cdn[${i}]: ${u.substring(0, 140)}`));
}

run();
