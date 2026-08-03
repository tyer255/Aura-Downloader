const shortcode = "DB1D7rwyF9H";

async function test(url, extraHeaders = {}) {
  console.log(`\nTesting: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "198387",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        ...extraHeaders
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Len:", text.length, "Snippet:", text.substring(0, 400));
    if (text.includes("edge_sidecar_to_children") || text.includes("carousel_media") || text.includes("items")) {
      console.log(">>> SUCCESS! Contains media items!");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await test(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=1`);
  await test(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`);
  await test(`https://www.instagram.com/api/v1/media/by/shortcode/${shortcode}/info/`);
  await test(`https://www.instagram.com/graphql/query/?query_hash=b3055315a7b2869384b54448e4ad6096&variables=${encodeURIComponent(JSON.stringify({shortcode}))}`);
  await test(`https://www.instagram.com/graphql/query/?query_hash=2b0673e0dc4580674a88d426fe00ea90&variables=${encodeURIComponent(JSON.stringify({shortcode}))}`);
}

run();
