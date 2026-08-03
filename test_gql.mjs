const shortcode = "DB1D7rwyF9H";

async function testGql(docId, vars, headers) {
  const url = `https://www.instagram.com/graphql/query/?doc_id=${docId}&variables=${encodeURIComponent(JSON.stringify(vars))}`;
  console.log(`\nTesting DocID ${docId}...`);
  try {
    const res = await fetch(url, { headers });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2).substring(0, 800));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  const docIds = [
    "24368985919464652",
    "8828250000361280",
    "10015901848480474",
    "2531393630255403",
    "5243166649132142",
    "5918804921477752",
    "17888485218204641"
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-IG-App-ID': '936619743392459',
    'X-ASBD-ID': '198387',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };

  for (const id of docIds) {
    await testGql(id, { shortcode }, headers);
  }
}

run();
