import fetch from 'node-fetch';

async function testScrapers(shortcode) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log("Testing Instagram Carousel scrapers for:", postUrl);

  // 1. Test SnapSave / SaveInsta endpoint
  try {
    console.log("\n--- Testing SnapSave / SaveInsta ---");
    const params = new URLSearchParams();
    params.append('q', postUrl);
    params.append('vt', 'instagram');

    const res = await fetch("https://snapsave.app/action.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://snapsave.app",
        "Referer": "https://snapsave.app/"
      },
      body: params
    });
    console.log("SnapSave status:", res.status);
    if (res.ok) {
      const html = await res.text();
      console.log("SnapSave raw HTML/JS len:", html.length);
      // SnapSave obfuscates output with eval(function(p,a,c,k,e,d)...)
      // We can deobfuscate SnapSave JS!
    }
  } catch(e) {
    console.log("SnapSave error:", e.message);
  }

  // 2. Test FastDL (https://fastdl.app/c/)
  try {
    console.log("\n--- Testing FastDL / SaveFrom / Indown ---");
    const params = new URLSearchParams();
    params.append('url', postUrl);

    const res = await fetch("https://fastdl.app/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://fastdl.app",
        "Referer": "https://fastdl.app/"
      },
      body: params
    });
    console.log("FastDL status:", res.status);
    if (res.ok) {
      const json = await res.json();
      console.log("FastDL JSON:", JSON.stringify(json).substring(0, 300));
    }
  } catch(e) {
    console.log("FastDL error:", e.message);
  }

  // 3. Test Instagram GraphQL query with doc_id doc_id=17888483320088557 or 8845758582119840
  try {
    console.log("\n--- Testing Instagram GraphQL doc_id ---");
    const docIds = ["8845758582119840", "24368985919464652", "17888483320088557"];
    for (const docId of docIds) {
      const gqlUrl = `https://www.instagram.com/graphql/query/?doc_id=${docId}&variables=${encodeURIComponent(JSON.stringify({ shortcode }))}`;
      const res = await fetch(gqlUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
          "X-IG-App-ID": "936619743392459",
          "Accept": "*/*"
        }
      });
      console.log(`doc_id ${docId} status:`, res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(`doc_id ${docId} response len:`, text.length);
        if (text.includes("edge_sidecar_to_children") || text.includes("carousel_media")) {
          console.log(`doc_id ${docId} HAS CAROUSEL DATA!`);
        }
      }
    }
  } catch(e) {
    console.log("GraphQL doc_id error:", e.message);
  }
}

testScrapers("C3x-Z2_S0gY");
