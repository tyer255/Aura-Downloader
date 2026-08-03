const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

async function test(name, fn) {
  console.log(`\n================ ${name} ================`);
  try {
    const res = await fn();
    console.log(`[${name}] SUCCESS:`, typeof res === 'object' ? JSON.stringify(res, null, 2).substring(0, 1500) : String(res).substring(0, 500));
  } catch (e) {
    console.log(`[${name}] FAILED:`, e.message);
  }
}

async function run() {
  // 1. SaveInsta / SnapInsta (v3)
  await test("SaveInsta AJAX", async () => {
    const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://saveig.app",
        "Referer": "https://saveig.app/"
      },
      body: `q=${encodeURIComponent(testUrl)}&t=media&lang=en`
    });
    return await res.json();
  });

  // 2. SnapInsta app
  await test("SnapInsta app", async () => {
    const res = await fetch("https://snapinsta.app/action2.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://snapinsta.app",
        "Referer": "https://snapinsta.app/"
      },
      body: `url=${encodeURIComponent(testUrl)}&action=post`
    });
    return await res.text();
  });

  // 3. FastDL app
  await test("FastDL c/", async () => {
    const res = await fetch("https://fastdl.app/c/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Origin": "https://fastdl.app",
        "Referer": "https://fastdl.app/"
      },
      body: `url=${encodeURIComponent(testUrl)}`
    });
    return await res.text();
  });

  // 4. IG Downloader API (api.igdownloader.app)
  await test("IGDownloader API", async () => {
    const res = await fetch("https://api.igdownloader.app/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({ url: testUrl })
    });
    return await res.json();
  });
}

run();
