async function testThreads(sc) {
  const url = `https://www.threads.net/t/${sc}`;
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("Includes thread_items:", html.includes("thread_items"));
    console.log("Includes carousel_media:", html.includes("carousel_media"));
    console.log("Includes image_versions2:", html.includes("image_versions2"));
    console.log("Includes video_versions:", html.includes("video_versions"));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testThreads("DB1D7rwyF9H");
  await testThreads("C9hV0C6y_nZ");
}

run();
