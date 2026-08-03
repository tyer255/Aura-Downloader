import fetch from 'node-fetch';

async function testA1(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
  console.log("Testing ?__a=1&__d=dis for:", shortcode);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "X-IG-App-ID": "936619743392459",
      "X-ASBD-ID": "198387",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "*/*",
      "Cookie": "csrftoken=missing; mid=Y0..."
    }
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body snippet:", text.substring(0, 300));
}

testA1("C3x-Z2_S0gY");
