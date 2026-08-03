async function testScraper(name, fn) {
  console.log(`\nTesting ${name}...`);
  try {
    const res = await fn();
    console.log(`[${name}] Status/Result:`, typeof res === 'object' ? JSON.stringify(res, null, 2).substring(0, 800) : res.substring(0, 400));
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
  }
}

async function run() {
  const shortcode = "DB1D7rwyF9H";
  const fullUrl = `https://www.instagram.com/p/${shortcode}/`;

  // 1. Instagram ?__a=1&__d=dis
  await testScraper("Instagram __a=1", async () => {
    const res = await fetch(`${fullUrl}?__a=1&__d=dis`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*"
      }
    });
    return await res.text();
  });

  // 2. indown.io scraper
  await testScraper("indown.io", async () => {
    const pageRes = await fetch("https://indown.io/");
    const cookies = pageRes.headers.get("set-cookie") || "";
    const pageHtml = await pageRes.text();
    const tokenMatch = pageHtml.match(/name="_token"\s+value="([^"]+)"/);
    const token = tokenMatch ? tokenMatch[1] : "";

    const formData = new URLSearchParams();
    formData.append("link", fullUrl);
    formData.append("referer", "indown");
    formData.append("_token", token);

    const postRes = await fetch("https://indown.io/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: formData.toString()
    });
    return await postRes.text();
  });

  // 3. saveig.app / snapinsta
  await testScraper("saveig.app API", async () => {
    const formData = new URLSearchParams();
    formData.append("q", fullUrl);
    formData.append("t", "media");
    formData.append("lang", "en");

    const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: formData.toString()
    });
    return await res.json();
  });
}

run();
