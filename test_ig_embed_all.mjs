async function testIgEmbed(sc) {
  console.log(`\nTesting shortcode embed: ${sc}`);
  const embedUrl = `https://www.instagram.com/p/${sc}/embed/captioned/`;
  try {
    const res = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
      }
    });
    const html = await res.text();
    console.log("HTML length:", html.length);
    const videoMatches = [...html.matchAll(/"video_url":"([^"]+)"/g)].map(m => m[1].replace(/\\\//g, "/"));
    const displayMatches = [...html.matchAll(/"display_url":"([^"]+)"/g)].map(m => m[1].replace(/\\\//g, "/"));
    
    console.log("video_url matches:", videoMatches.length);
    videoMatches.forEach((v, i) => console.log(`  v[${i}]:`, v.substring(0, 100)));

    console.log("display_url matches:", displayMatches.length);
    displayMatches.forEach((d, i) => console.log(`  d[${i}]:`, d.substring(0, 100)));

  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testIgEmbed("C83_w3aSyL_");
  await testIgEmbed("C9hV0C6y_nZ");
  await testIgEmbed("DB1D7rwyF9H");
}

run();
