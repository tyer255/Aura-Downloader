import * as cheerio from 'cheerio';

const shortcode = "C9hV0C6y_nZ"; // Instagram carousel with multiple photos
const carouselUrl = `https://www.instagram.com/p/${shortcode}/`;

async function testMethod(name, fn) {
  console.log(`\n================ Method: ${name} ================`);
  try {
    const res = await fn();
    console.log(`[${name}] SUCCESS:`, typeof res === 'object' ? JSON.stringify(res, null, 2).substring(0, 1200) : res.substring(0, 400));
  } catch (e) {
    console.log(`[${name}] FAILED:`, e.message);
  }
}

async function run() {
  // Method 1: Instagram Web API / info
  await testMethod("Instagram web info v1", async () => {
    const res = await fetch(`https://www.instagram.com/api/v1/media/by/shortcode/${shortcode}/info/`, {
      headers: {
        "User-Agent": "Instagram 219.0.0.12.117 Android",
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*"
      }
    });
    console.log("Status:", res.status);
    return await res.json();
  });

  // Method 2: Embed Page Deep Scrape
  await testMethod("Embed Page Deep Scrape", async () => {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15"
      }
    });
    const html = await res.text();
    const matches = [...html.matchAll(/https:\\\/\\\/scontent[^\s"'\\]+/g)].map(m => m[0].replace(/\\\//g, '/').replace(/\\u0026/g, '&'));
    const unique = [...new Set(matches)];
    return { htmlLength: html.length, uniqueCdnUrls: unique };
  });

  // Method 3: Direct Page HTML Scrape with Android App User-Agent
  await testMethod("Direct Page HTML Scrape (Android UA)", async () => {
    const res = await fetch(carouselUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none"
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    const cdnUrls = [...html.matchAll(/https?:\/\/[^\s"'<>]+?(?:cdninstagram|fbcdn|scontent)[^\s"'<>]+/gi)].map(m => m[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
    return { status: res.status, uniqueCdnUrls: [...new Set(cdnUrls)].slice(0, 15) };
  });

  // Method 4: save-insta.com
  await testMethod("save-insta.com API", async () => {
    const res = await fetch("https://www.save-insta.com/wp-json/aio-dl/video-data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: `url=${encodeURIComponent(carouselUrl)}`
    });
    return await res.json();
  });

  // Method 5: instasaved.net
  await testMethod("instasaved.net API", async () => {
    const res = await fetch(`https://instasaved.net/api/ig/post?url=${encodeURIComponent(carouselUrl)}`);
    return await res.json();
  });
}

run();
