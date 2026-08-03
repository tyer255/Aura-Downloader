import fs from 'fs';

async function testServices(shortcode) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log("Testing Instagram Carousel extraction for URL:", postUrl);

  // 1. Publer API
  try {
    console.log("\n--- Testing Publer API ---");
    const publerRes = await fetch("https://publer.io/api/v1/tools/media-downloader", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://publer.io",
        "Referer": "https://publer.io/tools/media-downloader"
      },
      body: JSON.stringify({ url: postUrl })
    });
    console.log("Publer status:", publerRes.status);
    if (publerRes.ok) {
      const publerData = await publerRes.json();
      console.log("Publer response:", JSON.stringify(publerData).substring(0, 300));
      if (publerData.job_id) {
        // Poll job status
        let attempts = 0;
        while (attempts < 10) {
          await new Promise(r => setTimeout(r, 1000));
          attempts++;
          const jobRes = await fetch(`https://publer.io/api/v1/tools/media-downloader/job_status/${publerData.job_id}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            console.log(`Publer job attempt ${attempts} status:`, jobData.status);
            if (jobData.status === "complete") {
              console.log("Publer payload count:", jobData.payload?.length);
              if (jobData.payload) {
                jobData.payload.forEach((p, i) => {
                  console.log(`  [Item ${i+1}] type: ${p.type}, url: ${p.path?.substring(0, 60)}`);
                });
              }
              break;
            }
          }
        }
      }
    }
  } catch(e) {
    console.log("Publer error:", e.message);
  }

  // 2. Cobalt API
  try {
    console.log("\n--- Testing Cobalt Instances ---");
    const cobaltInstances = [
      "https://api.cobalt.tools/api/json",
      "https://cobalt-api.kwiatek.xyz/api/json",
      "https://api.v0.cobalt.tools/api/json"
    ];
    for (const cUrl of cobaltInstances) {
      try {
        const cRes = await fetch(cUrl, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          },
          body: JSON.stringify({ url: postUrl })
        });
        console.log(`Cobalt (${cUrl}) status:`, cRes.status);
        if (cRes.ok) {
          const cData = await cRes.json();
          console.log("Cobalt status code:", cData.status, "picker items:", cData.picker?.length);
          if (cData.picker) {
            cData.picker.forEach((item, i) => {
              console.log(`  [Item ${i+1}] type: ${item.type}, url: ${item.url?.substring(0, 60)}`);
            });
            break;
          }
        }
      } catch(e) {}
    }
  } catch(e) {}

  // 3. Saveig / Snapinsta endpoint test
  try {
    console.log("\n--- Testing SaveIG / SnapInsta endpoint ---");
    const saveigRes = await fetch("https://saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: new URLSearchParams({ q: postUrl, t: "media", lang: "en" })
    });
    console.log("SaveIG status:", saveigRes.status);
    if (saveigRes.ok) {
      const saveigData = await saveigRes.json();
      console.log("SaveIG status key:", saveigData.status);
      if (saveigData.data) {
        console.log("SaveIG HTML snippet length:", saveigData.data.length);
        const matches = [...saveigData.data.matchAll(/href="([^"]+)"[^>]*download/gi)].map(m => m[1]);
        console.log("SaveIG download link count:", matches.length);
        matches.forEach((m, i) => console.log(`  [Item ${i+1}]: ${m.substring(0, 60)}`));
      }
    }
  } catch(e) {
    console.log("SaveIG error:", e.message);
  }

  // 4. Test InDown / FastDL AJAX
  try {
    console.log("\n--- Testing FastDL / InDown ---");
    const indownRes = await fetch("https://indown.io/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: new URLSearchParams({ link: postUrl, referer: "https://indown.io/" })
    });
    console.log("InDown status:", indownRes.status);
    if (indownRes.ok) {
      const html = await indownRes.text();
      const links = [...html.matchAll(/href="([^"]+)"[^>]*class="[^"]*download[^"]*"/gi)].map(m => m[1]);
      console.log("InDown found links:", links.length);
    }
  } catch(e) {}
}

testServices("C3x-Z2_S0gY");
