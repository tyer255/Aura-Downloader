const shortcode = "DB1D7rwyF9H";

async function test(name, url, headers = {}) {
  console.log(`\n================ Testing ${name} ================`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Instagram 219.0.0.12.117 Android (30/11; 480dpi; 1080x2260; vivo; V2025; V2025; qcom; en_US; 340901123)",
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*",
        ...headers
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Len:", text.length, "Snippet:", text.substring(0, 400));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await test("v1 info endpoint", `https://www.instagram.com/api/v1/media/by/shortcode/${shortcode}/info/`);
  await test("p ?__a=1&__d=dis", `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`);
  await test("oembed endpoint", `https://www.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`);
  await test("i.instagram.com v1 info", `https://i.instagram.com/api/v1/media/by/shortcode/${shortcode}/info/`);
}

run();
