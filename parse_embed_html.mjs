async function run() {
  const shortcode = "DB1D7rwyF9H";
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();
  console.log("Embed HTML snippet:", html.substring(0, 1500));

  // Search for any class or image tags in html
  const imgTags = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  console.log("Img tags count:", imgTags.length);
  imgTags.forEach((img, i) => console.log(`  img[${i}]: ${img.substring(0, 120)}`));

  // Search for any script tags containing data or window.__additionalData
  const scriptData = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m => m[1]);
  scriptData.forEach((s, i) => {
    if (s.includes('http') || s.includes('URL') || s.includes('display') || s.includes('Media')) {
      console.log(`Script #${i} (len ${s.length}):`, s.substring(0, 300));
    }
  });
}

run();
