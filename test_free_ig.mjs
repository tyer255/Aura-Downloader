const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

async function testCobaltV10(endpoint) {
  console.log(`Testing Cobalt v10 at ${endpoint}...`);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        url: testUrl
      })
    });
    console.log(`[${endpoint}] Status:`, res.status);
    const data = await res.json();
    console.log(`[${endpoint}] Response:`, JSON.stringify(data, null, 2).substring(0, 1000));
  } catch (e) {
    console.log(`[${endpoint}] Error:`, e.message);
  }
}

async function testRyzen() {
  console.log("Testing Ryzendesu Instagram API...");
  try {
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(testUrl)}`);
    console.log("[Ryzendesu] Status:", res.status);
    const data = await res.json();
    console.log("[Ryzendesu] Response:", JSON.stringify(data, null, 2).substring(0, 1000));
  } catch (e) {
    console.log("[Ryzendesu] Error:", e.message);
  }
}

async function run() {
  await testCobaltV10("https://api.cobalt.tools/");
  await testCobaltV10("https://cobalt.q0.is/");
  await testCobaltV10("https://co.wuk.sh/");
  await testRyzen();
}

run();
