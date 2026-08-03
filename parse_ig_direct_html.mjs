async function run() {
  const shortcode = "DB1D7rwyF9H";
  const url = `https://www.instagram.com/p/${shortcode}/embed/`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  const html = await res.text();

  // Search for edge_sidecar_to_children or display_url or video_url or xdt_shortcode_media
  console.log("Includes edge_sidecar_to_children:", html.includes("edge_sidecar_to_children"));
  console.log("Includes display_url:", html.includes("display_url"));
  console.log("Includes video_url:", html.includes("video_url"));

  // Match all scontent or cdninstagram image/video URLs
  const cdnUrls = [...html.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]+scontent[^\s"'<>\\)]+/gi)]
    .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));
  
  console.log("Found scontent CDN URLs count:", cdnUrls.length);
  const uniqueCdn = [...new Set(cdnUrls)];
  console.log("Unique scontent CDN URLs count:", uniqueCdn.length);
  uniqueCdn.forEach((u, i) => console.log(`  cdn[${i}]: ${u.substring(0, 120)}`));
}

run();
