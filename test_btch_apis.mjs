async function testBtchApi(endpoint) {
  const url = "https://www.instagram.com/p/DB1D7rwyF9H/";
  console.log(`Fetching ${endpoint}...`);
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testBtchApi("https://api.btch.bz/igdl");
  await testBtchApi("https://api.btch.bz/v2/igdl");
  await testBtchApi("https://api.btch.bz/v3/igdl");
}

run();
