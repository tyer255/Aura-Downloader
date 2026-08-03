async function test() {
  const testUrl = "https://www.instagram.com/p/C9hV0C6y_nZ/";
  console.log("Testing Instagram URL:", testUrl);

  // 1. instagram-url-direct
  try {
    const instagramGetUrl = (await import('instagram-url-direct')).default;
    const res = await instagramGetUrl(testUrl);
    console.log("\n--- instagram-url-direct ---");
    console.log(JSON.stringify(res, null, 2).substring(0, 800));
  } catch (e) {
    console.log("instagram-url-direct error:", e.message);
  }

  // 2. ruhend-scraper
  try {
    const { igdl } = await import('ruhend-scraper');
    const res = await igdl(testUrl);
    console.log("\n--- ruhend-scraper ---");
    console.log(JSON.stringify(res, null, 2).substring(0, 800));
  } catch (e) {
    console.log("ruhend-scraper error:", e.message);
  }

  // 3. bochilteam snapsave
  try {
    const { snapsave } = await import('@bochilteam/scraper-snapsave');
    const res = await snapsave(testUrl);
    console.log("\n--- snapsave ---");
    console.log(JSON.stringify(res, null, 2).substring(0, 800));
  } catch (e) {
    console.log("snapsave error:", e.message);
  }

  // 4. igdl.js / ultra-igdl / api-dylux
  try {
    const dylux = await import('api-dylux');
    if (dylux.default?.instagram) {
      const res = await dylux.default.instagram(testUrl);
      console.log("\n--- api-dylux instagram ---");
      console.log(JSON.stringify(res, null, 2).substring(0, 800));
    }
  } catch (e) {
    console.log("api-dylux error:", e.message);
  }
}

test();
