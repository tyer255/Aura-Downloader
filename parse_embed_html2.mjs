async function run() {
  const shortcode = "DB1D7rwyF9H";
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();

  // Search for any occurrence of 'graphql' or 'shortcode_media' or 'carousel_media' or 'items' or 'display_url' in the html string
  console.log("Includes shortcode_media:", html.includes("shortcode_media"));
  console.log("Includes display_url:", html.includes("display_url"));
  console.log("Includes cdninstagram:", html.includes("cdninstagram"));
  console.log("Includes scontent:", html.includes("scontent"));

  // Match all URLs starting with http
  const allUrls = [...html.matchAll(/https?:\/\/[^\s"'<>\\)]+/gi)].map(m => m[0]);
  const cdnUrls = allUrls.filter(u => u.includes('scontent') || u.includes('cdninstagram') || u.includes('fbcdn'));
  console.log("Found CDN URLs count:", cdnUrls.length);
  [...new Set(cdnUrls)].forEach((u, idx) => console.log(`  CDN[${idx}]: ${u.substring(0, 120)}`));
}

run();
