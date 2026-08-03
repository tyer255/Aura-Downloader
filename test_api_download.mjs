async function testApiDownload(url) {
  console.log("Posting to /api/download with URL:", url);
  try {
    const res = await fetch("http://localhost:3000/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, platform: "instagram" })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Result:", JSON.stringify(json, null, 2).substring(0, 1500));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testApiDownload("https://www.instagram.com/p/DB1D7rwyF9H/");
  await testApiDownload("https://www.instagram.com/reel/C9hV0C6y_nZ/");
}

run();
