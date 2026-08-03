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

  // Find all script tags containing __bbox
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const s = match[1];
    if (s.includes('__bbox')) {
      console.log("Found script with __bbox, length:", s.length);
      
      // Look for display_url / video_url / image_versions2 / carousel_media / edge_sidecar_to_children
      console.log("Includes edge_sidecar_to_children:", s.includes("edge_sidecar_to_children"));
      console.log("Includes carousel_media:", s.includes("carousel_media"));
      console.log("Includes image_versions2:", s.includes("image_versions2"));
      console.log("Includes display_url:", s.includes("display_url"));

      // Match all occurrences of display_url or video_url or candidates
      const displayUrls = [...s.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
      console.log("display_url matches count:", displayUrls.length);
      displayUrls.forEach((u, i) => console.log(`  disp[${i}]: ${u.substring(0, 100)}`));

      const videoUrls = [...s.matchAll(/"video_url"\s*:\s*"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
      console.log("video_url matches count:", videoUrls.length);
      videoUrls.forEach((v, i) => console.log(`  vid[${i}]: ${v.substring(0, 100)}`));
    }
  }
}

run();
