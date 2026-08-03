async function testCobalt(url) {
  console.log("Testing Cobalt on Instagram URL:", url);
  try {
    const res = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "AuraDownloader/1.0"
      },
      body: JSON.stringify({
        url: url,
        vQuality: "max"
      })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Cobalt Response:", JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (e) {
    console.log("Cobalt error:", e.message);
  }
}

testCobalt("https://www.instagram.com/p/DB1D7rwyF9H/");
testCobalt("https://www.instagram.com/p/C9hV0C6y_nZ/");
