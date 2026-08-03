import fetch from 'node-fetch';

async function testFxIG(shortcode) {
  console.log("Testing FX/DD Instagram for shortcode:", shortcode);

  const testEndpoints = [
    `https://api.ddinstagram.com/p/${shortcode}`,
    `https://api.vxinstagram.com/p/${shortcode}`,
    `https://api.kkinstagram.com/p/${shortcode}`,
    `https://ddinstagram.com/p/${shortcode}/`,
    `https://vxinstagram.com/p/${shortcode}/`
  ];

  for (const ep of testEndpoints) {
    try {
      console.log("\nFetching:", ep);
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "TelegramBot (like TwitterBot)"
        }
      });
      console.log("Status:", res.status);
      if (res.ok) {
        const text = await res.text();
        console.log("Response length:", text.length);
        if (text.startsWith("{")) {
          const json = JSON.parse(text);
          console.log("JSON keys:", Object.keys(json));
          if (json.media_list) console.log("media_list count:", json.media_list.length);
          if (json.items) console.log("items count:", json.items.length);
        } else {
          // Parse meta tags
          const ogImages = [...text.matchAll(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/gi)].map(m => m[1]);
          const ogVideos = [...text.matchAll(/<meta\s+(?:property|name)="og:video"\s+content="([^"]+)"/gi)].map(m => m[1]);
          console.log("og:image count:", ogImages.length, "og:video count:", ogVideos.length);
          ogImages.forEach((img, i) => console.log(`  og:image ${i+1}:`, img.substring(0, 80)));
        }
      }
    } catch(e) {
      console.log("Error for", ep, ":", e.message);
    }
  }
}

testFxIG("C3x-Z2_S0gY");
