import fetch from 'node-fetch';

async function checkEmbedHtml(shortcode) {
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  console.log("Embed status:", res.status);
  const html = await res.text();
  console.log("Embed html length:", html.length);
  console.log("Embed html snippet (first 1000 chars):\n", html.substring(0, 1000));
}

checkEmbedHtml("C3x-Z2_S0gY");
