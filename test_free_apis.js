import fetch from 'node-fetch';

async function testFreeApis(shortcode) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log("Testing free IG download APIs for:", postUrl);

  const apis = [
    { name: "Vreden API", url: `https://api.vreden.web.id/api/igdl?url=${encodeURIComponent(postUrl)}` },
    { name: "Siputzx API", url: `https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(postUrl)}` },
    { name: "Ryzendesu API", url: `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(postUrl)}` },
    { name: "SamirX API", url: `https://samirxpikachu.run.place/igdl?url=${encodeURIComponent(postUrl)}` },
    { name: "Fgmods API", url: `https://api.fgmods.xyz/api/downloader/igdl?url=${encodeURIComponent(postUrl)}` },
    { name: "Agatz API", url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(postUrl)}` },
    { name: "TiklyDown API", url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(postUrl)}` },
    { name: "Cobalt (Wuk)", url: "https://co.wuk.sh/api/json", method: "POST", body: { url: postUrl } },
    { name: "Cobalt (Xyra)", url: "https://cobalt.xyra.net/api/json", method: "POST", body: { url: postUrl } }
  ];

  for (const api of apis) {
    try {
      console.log(`\n--- Testing ${api.name} ---`);
      const opts = {
        method: api.method || "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      };
      if (api.body) opts.body = JSON.stringify(api.body);

      const res = await fetch(api.url, opts);
      console.log(`${api.name} status:`, res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(`${api.name} response len:`, text.length, "snippet:", text.substring(0, 300));
        try {
          const json = JSON.parse(text);
          // Check for array or picker or media items
          if (json.data && Array.isArray(json.data)) {
            console.log(`  -> SUCCESS! Found ${json.data.length} items in data array!`);
          } else if (json.result && Array.isArray(json.result)) {
            console.log(`  -> SUCCESS! Found ${json.result.length} items in result array!`);
          } else if (json.picker && Array.isArray(json.picker)) {
            console.log(`  -> SUCCESS! Found ${json.picker.length} items in picker array!`);
          }
        } catch(e){}
      }
    } catch(e) {
      console.log(`${api.name} error:`, e.message);
    }
  }
}

testFreeApis("C3x-Z2_S0gY");
