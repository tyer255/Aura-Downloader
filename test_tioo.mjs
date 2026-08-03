async function run() {
  const url = "https://www.instagram.com/p/DB1D7rwyF9H/";
  const endpoint = `https://backend1.tioo.eu.org/igdl?url=${encodeURIComponent(url)}`;
  console.log(`Fetching ${endpoint}...`);
  try {
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
