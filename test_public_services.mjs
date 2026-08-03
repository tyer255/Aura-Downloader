async function testService(name, url) {
  console.log(`\n=== Testing ${name} ===`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response (first 600 chars):", text.substring(0, 600));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  const sc = "DB1D7rwyF9H";
  await testService("vxinstagram API", `https://api.vxinstagram.com/p/${sc}`);
  await testService("ddinstagram API", `https://ddinstagram.com/p/${sc}`);
  await testService("ddinstagram JSON", `https://ddinstagram.com/images/${sc}/1`);
  await testService("snapinsta / FastDL endpoint", `https://snapinsta.app/api/video?url=https://www.instagram.com/p/${sc}/`);
}

run();
