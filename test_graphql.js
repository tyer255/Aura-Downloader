import fetch from 'node-fetch';

async function testGQL(shortcode) {
  console.log("Testing GraphQL for:", shortcode);

  const gqlUrl = `https://www.instagram.com/graphql/query/?doc_id=24368985919464652&variables=${encodeURIComponent(JSON.stringify({ shortcode }))}`;
  
  const res = await fetch(gqlUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      "X-FB-LSD": "AVqbB123",
      "X-ASBD-ID": "198387",
      "Accept": "*/*",
      "Sec-Fetch-Mode": "cors"
    }
  });

  console.log("GQL status:", res.status);
  const text = await res.text();
  console.log("GQL body:", text);
}

testGQL("C3x-Z2_S0gY");
