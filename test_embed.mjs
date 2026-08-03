async function testEmbed(sc) {
  const url = `https://www.instagram.com/p/${sc}/embed/captioned/`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    }
  });
  const html = await res.text();
  console.log("HTML length:", html.length);
  
  // Find all display_url and video_url occurrences in HTML
  const displayUrls = [...html.matchAll(/"display_url":"([^"]+)"/g)].map(m => m[1].replace(/\\\//g, "/"));
  const videoUrls = [...html.matchAll(/"video_url":"([^"]+)"/g)].map(m => m[1].replace(/\\\//g, "/"));
  
  console.log("Display URLs found:", displayUrls.length);
  displayUrls.forEach((u, i) => console.log(`  [${i}]: ${u.substring(0, 100)}`));
  
  console.log("Video URLs found:", videoUrls.length);
  videoUrls.forEach((u, i) => console.log(`  [${i}]: ${u.substring(0, 100)}`));

  // Let's also check for window.__additionalDataLoaded or gql data or script tags
  const scripts = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m => m[1]);
  for (const s of scripts) {
    if (s.includes("display_url") || s.includes("edge_sidecar_to_children") || s.includes("carousel_media")) {
      console.log("Found relevant script block length:", s.length);
      // print first 500 chars
      console.log(s.substring(0, 500));
    }
  }
}

testEmbed("C9hV0C6y_nZ");
testEmbed("DB1D7rwyF9H");
