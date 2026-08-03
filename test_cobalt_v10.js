import fetch from 'node-fetch';

async function testCobaltV10(shortcode) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log("Testing Cobalt v10 for:", postUrl);

  const res = await fetch("https://api.cobalt.tools/", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    body: JSON.stringify({
      url: postUrl
    })
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response len:", text.length);
  console.log("Response text:", text);
}

testCobaltV10("C3x-Z2_S0gY");
