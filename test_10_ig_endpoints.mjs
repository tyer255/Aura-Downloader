const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";
const testShortcode = "DB1D7rwyF9H";

async function test(name, fn) {
  console.log(`\n================ Testing ${name} ================`);
  try {
    const res = await fn();
    console.log(`[${name}] SUCCESS:`, typeof res === 'object' ? JSON.stringify(res, null, 2).substring(0, 1500) : String(res).substring(0, 400));
  } catch (e) {
    console.log(`[${name}] FAILED:`, e.message);
  }
}

async function run() {
  // 1. Publer API
  await test("Publer Media API", async () => {
    const res = await fetch("https://publer.io/api/v1/job_status/medias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({ url: testUrl })
    });
    return await res.json();
  });

  // 2. SnapSave / SnapInsta / SaveIG
  await test("SaveIG API", async () => {
    const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: `q=${encodeURIComponent(testUrl)}&t=media&lang=en`
    });
    return await res.json();
  });

  // 3. Instagram Embed JSON with Mobile UA
  await test("Instagram Embed Script Parsing", async () => {
    const res = await fetch(`https://www.instagram.com/p/${testShortcode}/embed/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      }
    });
    const html = await res.text();
    const videoMatches = [...html.matchAll(/"video_url":"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
    const displayMatches = [...html.matchAll(/"display_url":"([^"]+)"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
    return {
      htmlLength: html.length,
      videoMatches: [...new Set(videoMatches)],
      displayMatches: [...new Set(displayMatches)]
    };
  });

  // 4. InstaStories / InstaNavigation
  await test("InstaStories API", async () => {
    const res = await fetch(`https://instastories.watch/api/v1/post?url=${encodeURIComponent(testUrl)}`);
    return await res.json();
  });

  // 5. Cobalt public API
  await test("Cobalt API sciter", async () => {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ url: testUrl })
    });
    return await res.json();
  });

  // 6. FastDL API
  await test("FastDL convert API", async () => {
    const res = await fetch("https://fastdl.app/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({ url: testUrl })
    });
    return await res.json();
  });
}

run();
