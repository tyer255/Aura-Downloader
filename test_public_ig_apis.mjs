const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

async function testApi(name, fn) {
  console.log(`\n================ API: ${name} ================`);
  try {
    const res = await fn();
    console.log(`[${name}] SUCCESS:`, typeof res === 'object' ? JSON.stringify(res, null, 2).substring(0, 1500) : String(res).substring(0, 500));
  } catch (e) {
    console.log(`[${name}] FAILED:`, e.message);
  }
}

async function run() {
  // 1. Cobalt Instances
  await testApi("Cobalt API list", async () => {
    const instRes = await fetch("https://instances.hyper.lol/instances.json");
    const instances = await instRes.json();
    console.log("Cobalt instances count:", instances?.length);
    const apiInstances = instances.filter(i => i.api && i.score > 50).slice(0, 5);
    for (const inst of apiInstances) {
      console.log("Testing Cobalt instance:", inst.url);
      try {
        const cRes = await fetch(`${inst.url}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ url: testUrl })
        });
        const data = await cRes.json();
        if (data && (data.url || data.picker)) {
          return { instance: inst.url, data };
        }
      } catch (e) {
        console.log("  Failed instance:", inst.url, e.message);
      }
    }
    throw new Error("No Cobalt instance succeeded");
  });

  // 2. Vreden API
  await testApi("Vreden API", async () => {
    const res = await fetch(`https://api.vreden.web.id/api/igdl?url=${encodeURIComponent(testUrl)}`);
    return await res.json();
  });

  // 3. Ryzendesu API
  await testApi("Ryzendesu API", async () => {
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(testUrl)}`);
    return await res.json();
  });

  // 4. FastDL Ajax
  await testApi("FastDL Ajax", async () => {
    const res = await fetch("https://fastdl.app/c/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: `url=${encodeURIComponent(testUrl)}`
    });
    return await res.text();
  });

  // 5. InDown.io
  await testProcessInDown(testUrl);
}

async function testProcessInDown(url) {
  await testApi("InDown.io", async () => {
    const pageRes = await fetch("https://indown.io/");
    const pageHtml = await pageRes.text();
    const tokenMatch = pageHtml.match(/name="_token"\s+value="([^"]+)"/);
    if (!tokenMatch) throw new Error("No _token found on InDown");

    const cookies = pageRes.headers.get('set-cookie') || '';
    const postRes = await fetch("https://indown.io/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Cookie": cookies
      },
      body: `referer=https%3A%2F%2Findown.io%2F&_token=${tokenMatch[1]}&link=${encodeURIComponent(url)}`
    });
    return await postRes.text();
  });
}

run();
