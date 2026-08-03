async function testEndpoint(name, url, options) {
  console.log(`\nTesting ${name}...`);
  try {
    const res = await fetch(url, options);
    console.log(`[${name}] Status:`, res.status);
    const text = await res.text();
    console.log(`[${name}] Output (first 600 chars):`, text.substring(0, 600));
    return text;
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
  }
}

async function run() {
  const targetUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

  // 1. ssinstagram.com
  await testEndpoint("ssinstagram.com", "https://v3.ssinstagram.com/api/ajaxSearch", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: `q=${encodeURIComponent(targetUrl)}&t=media&lang=en`
  });

  // 2. fastdl.app
  await testEndpoint("fastdl.app", "https://fastdl.app/api/convert", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    body: `url=${encodeURIComponent(targetUrl)}`
  });

  // 3. snapinsta.app / snapinsta.to
  await testEndpoint("snapinsta.to", "https://snapinsta.to/api/ajaxSearch", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    body: `q=${encodeURIComponent(targetUrl)}&t=media&lang=en`
  });
}

run();
