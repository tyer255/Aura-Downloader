// Test extractThreadsPost logic on Instagram carousel URLs
async function testThreadsExtractorOnIg(urlStr) {
  console.log(`\n================ Testing extractThreadsPost on Instagram URL: ${urlStr} ================`);
  const match = urlStr.match(/(?:p|reel|tv|post|t)\/([a-zA-Z0-9_-]+)/);
  const shortcode = match ? match[1] : null;
  console.log("Extracted shortcode:", shortcode);
  if (!shortcode) return;

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
  ];

  const fetchUrls = [
    `https://www.threads.net/t/${shortcode}`,
    `https://www.threads.net/embed/post/${shortcode}`,
    `https://www.instagram.com/p/${shortcode}/embed/`
  ];

  for (const fUrl of fetchUrls) {
    console.log(`Trying URL: ${fUrl}`);
    try {
      const res = await fetch(fUrl, {
        headers: {
          'User-Agent': userAgents[0],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      console.log(`Status for ${fUrl}:`, res.status);
      const html = await res.text();
      console.log(`HTML length for ${fUrl}: ${html.length}`);

      // Search for image_versions2 / video_versions / display_url
      const imgVersionCount = (html.match(/image_versions2/g) || []).length;
      const vidVersionCount = (html.match(/video_versions/g) || []).length;
      const displayUrlCount = (html.match(/display_url/g) || []).length;
      const carouselCount = (html.match(/carousel_media/g) || []).length;

      console.log(`Counts: image_versions2=${imgVersionCount}, video_versions=${vidVersionCount}, display_url=${displayUrlCount}, carousel_media=${carouselCount}`);

      // Extract image_versions2 URLs
      const imageVersionRegex = /"image_versions2":\s*(\{[^\}]+\})/g;
      let iMatch;
      const imgs = [];
      while ((iMatch = imageVersionRegex.exec(html)) !== null) {
        try {
          const iObj = JSON.parse(iMatch[1]);
          if (iObj?.candidates?.[0]?.url) {
            imgs.push(iObj.candidates[0].url);
          }
        } catch (e) {}
      }
      console.log(`Parsed image_versions2 URLs count: ${imgs.length}`);
      const uniqueImgs = [...new Set(imgs)];
      console.log(`Unique image_versions2 URLs count: ${uniqueImgs.length}`);
      uniqueImgs.forEach((img, idx) => console.log(`  Img #${idx + 1}: ${img.substring(0, 100)}`));

    } catch (e) {
      console.log(`Error fetching ${fUrl}:`, e.message);
    }
  }
}

async function run() {
  await testThreadsExtractorOnIg("https://www.instagram.com/p/DB1D7rwyF9H/");
  await testThreadsExtractorOnIg("https://www.instagram.com/p/C9hV0C6y_nZ/");
}

run();
