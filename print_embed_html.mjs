async function run() {
  const res = await fetch("https://www.instagram.com/p/DB1D7rwyF9H/embed/captioned/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
    }
  });
  const html = await res.text();
  console.log("Full HTML length:", html.length);
  // find script tags
  const scripts = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m => m[1]);
  console.log("Found scripts count:", scripts.length);
  scripts.forEach((s, i) => {
    if (s.length > 100) {
      console.log(`Script ${i} length ${s.length}:`, s.substring(0, 300));
    }
  });
}
run();
