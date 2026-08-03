const shortcode = "C9hV0C6y_nZ";

async function testDocId(idOrHash, isHash = false) {
  const vars = JSON.stringify({ shortcode });
  const url = isHash 
    ? `https://www.instagram.com/graphql/query/?query_hash=${idOrHash}&variables=${encodeURIComponent(vars)}`
    : `https://www.instagram.com/graphql/query/?doc_id=${idOrHash}&variables=${encodeURIComponent(vars)}`;

  console.log(`\nTesting ${isHash ? 'Hash' : 'DocID'}: ${idOrHash}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "*/*",
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "198387",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response len:", text.length, "Snippet:", text.substring(0, 300));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testDocId("24368985919464652");
  await testDocId("8828250000361280");
  await testDocId("10015901848480474");
  await testDocId("b3055315a7b2869384b54448e4ad6096", true);
  await testDocId("2b0673e0dc4580674a88d426fe00ea90", true);
}

run();
