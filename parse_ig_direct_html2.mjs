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

  // Find all http or https URLs
  const allUrls = [...html.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\)]+/gi)]
    .map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, ''));

  const imgUrls = allUrls.filter(u => u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.mp4') || u.includes('.heic') || u.includes('.webp'));
  console.log("Total image/video extension URLs found:", imgUrls.length);
  const uniqueImg = [...new Set(imgUrls)];
  console.log("Unique image/video extension URLs:", uniqueImg.length);
  uniqueImg.forEach((u, i) => console.log(`  img[${i}]: ${u.substring(0, 140)}`));
}

run();
