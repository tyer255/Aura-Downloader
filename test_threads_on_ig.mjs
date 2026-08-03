import fs from 'fs';

// Let's test embed fetch for IG shortcode
async function testIgEmbed(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  const html = await res.text();
  console.log("HTML length:", html.length);

  // Search for script tags
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const s = match[1];
    if (s.includes('display_url') || s.includes('video_url') || s.includes('sidecar') || s.includes('carousel')) {
      count++;
      console.log(`Script #${count} (len ${s.length}):`, s.substring(0, 300));
    }
  }
}

testIgEmbed("DB1D7rwyF9H");
