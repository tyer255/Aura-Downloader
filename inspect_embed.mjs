async function inspect(sc) {
  const url = `https://www.instagram.com/p/${sc}/embed/captioned/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  const html = await res.text();
  console.log("HTML length:", html.length);
  
  // Search for images/videos in html
  const imgMatches = [...html.matchAll(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/g)].map(m => m[1]);
  console.log("EmbeddedMediaImage:", imgMatches);

  const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m => m[1]);
  console.log("All img src count:", images.length);
  images.filter(i => i.includes('cdninstagram') || i.includes('fbcdn')).forEach(i => console.log("  img:", i.substring(0, 150)));

  // Look for JSON or script data
  const jsonMatches = [...html.matchAll(/\\\\"display_url\\\\":\\\\"(.*?)\\\\"/g)].map(m => m[1]);
  console.log("Escaped display_url count:", jsonMatches.length);

  const jsonMatches2 = [...html.matchAll(/"display_resources":\[(.*?)\]/g)].map(m => m[1]);
  console.log("display_resources count:", jsonMatches2.length);

  // Look for any CDN url
  const cdnUrls = [...html.matchAll(/https:\\\/\\\/[^\s"'\\]+?(?:cdninstagram|fbcdn)[^\s"'\\]+/g)].map(m => m[0].replace(/\\\//g, '/').replace(/\\u0026/g, '&'));
  console.log("CDN URLs count:", cdnUrls.length);
  const uniqueCdn = [...new Set(cdnUrls)];
  console.log("Unique CDN URLs count:", uniqueCdn.length);
  uniqueCdn.slice(0, 10).forEach(u => console.log("  CDN:", u.substring(0, 150)));
}

inspect("DB1D7rwyF9H");
