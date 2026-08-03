async function testApi(url) {
  console.log("Calling /api/download with URL:", url);
  try {
    const res = await fetch("http://localhost:3000/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 2000));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testApi("https://www.instagram.com/p/DB1D7rwyF9H/");
  await testApi("https://www.instagram.com/p/C9hV0C6y_nZ/");
}

run();
