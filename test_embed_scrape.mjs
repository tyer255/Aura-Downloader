async function testEmbedScrape(shortcode) {
  console.log(`\n================ Embed Scrape for: ${shortcode} ================`);
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  const html = await res.text();
  console.log("HTML length:", html.length);

  // Match all display_url
  const dispMatches = [...html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
  console.log("Found display_url count:", dispMatches.length);
  dispMatches.forEach((d, i) => console.log(`  disp[${i}]: ${d.substring(0, 100)}`));

  // Match all video_url
  const vidMatches = [...html.matchAll(/"video_url"\s*:\s*"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
  console.log("Found video_url count:", vidMatches.length);
  vidMatches.forEach((v, i) => console.log(`  vid[${i}]: ${v.substring(0, 100)}`));

  // Match all images/videos or sidecar/children in JSON script
  const sidecarMatch = html.match(/"edge_sidecar_to_children"\s*:\s*(\{[^}]+\})/);
  console.log("Has sidecar:", !!sidecarMatch);

  // Search for all URLs in stringified JSON blocks inside embed page
  const allJsonBlocks = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m => m[1]);
  console.log("JSON scripts count:", allJsonBlocks.length);
}

async function run() {
  await testEmbedScrape("DB1D7rwyF9H"); // Carousel post 1
  await testEmbedScrape("C9hV0C6y_nZ"); // Carousel post 2
}

run();
