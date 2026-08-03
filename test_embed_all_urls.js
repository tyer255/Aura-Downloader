import fetch from 'node-fetch';

async function testEmbedAllUrls(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    }
  });

  const html = await res.text();
  console.log("HTML len:", html.length);

  // Search for any occurrence of https and jpg/png/mp4
  const allUrls = [...html.matchAll(/(https?:\\?\/\\?\/[^\s"'<>]+)/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));

  const mediaUrls = allUrls.filter(u => u.includes('fbcdn') || u.includes('instagram') || u.includes('cdninstagram'));
  console.log("Total Instagram/CDN URLs found:", mediaUrls.length);

  const nonStatic = mediaUrls.filter(u => !u.includes('static.cdninstagram.com') && !u.includes('rsrc.php'));
  console.log("Non-static media URLs count:", nonStatic.length);

  nonStatic.forEach((u, i) => console.log(`  [NonStatic ${i+1}]: ${u.substring(0, 100)}`));
}

testEmbedAllUrls("C3x-Z2_S0gY");
